import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';
import { AttemptStatus, QuizStatus } from '@prisma/client';

const listAvailableQuizzes = async (studentId: number) => {
    // 1. Get classes student belongs to
    const studentClasses = await prisma.classStudent.findMany({
        where: { studentId },
        select: { classId: true }
    });

    const classIds = studentClasses.map(sc => sc.classId);

    // 2. Find published quizzes assigned to these classes
    // Also check if current time is within window (optional, but good for UX)
    const now = new Date();

    return prisma.quiz.findMany({
        where: {
            status: QuizStatus.PUBLISHED,
            assignedClasses: {
                some: {
                    classId: { in: classIds }
                }
            },
            startTime: { lte: now },
            endTime: { gte: now }
        },
        include: {
            _count: { select: { questions: true } }
        }
    });
};

const startAttempt = async (quizId: number, studentId: number) => {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: {
                    question: {
                        include: { options: true }
                    }
                }
            }
        }
    });

    if (!quiz) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
    }

    // Validation
    const now = new Date();
    if (quiz.status !== QuizStatus.PUBLISHED) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz is not active');
    }
    if (quiz.startTime && now < quiz.startTime) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has not started yet');
    }
    if (quiz.endTime && now > quiz.endTime) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has expired');
    }

    // Check if already attempted
    const existingAttempt = await prisma.quizAttempt.findFirst({
        where: {
            quizId,
            studentId,
            status: { in: [AttemptStatus.STARTED, AttemptStatus.SUBMITTED] }
        }
    });

    if (existingAttempt) {
        if (existingAttempt.status === AttemptStatus.SUBMITTED) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'You have already submitted this quiz');
        }
        // Resume logic could go here, but for now we just return the existing active attempt
        // But we need to return questions without correct answers
        // We will perform the sanitization in controller or here.
        // Let's return the sanitize structure.
    }

    // Create Attempt
    const attempt = await prisma.quizAttempt.create({
        data: {
            quizId,
            studentId,
            status: AttemptStatus.STARTED
        }
    });

    // Prepare response: Questions with options (sanitized)
    const questions = quiz.questions.map(q => ({
        id: q.question.id,
        text: q.question.text,
        type: q.question.type,
        marks: q.question.marks,
        options: q.question.options.map(opt => ({
            id: opt.id,
            text: opt.text
        }))
    }));

    return { attempt, questions };
};

const submitAttempt = async (attemptId: number, studentId: number, responses: any[]) => {
    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: { quiz: true }
    });

    if (!attempt) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
    }

    if (attempt.studentId !== studentId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Not your attempt');
    }

    if (attempt.status === AttemptStatus.SUBMITTED) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Already submitted');
    }

    // Calculate score
    let score = 0;

    // Fetch valid answers
    // We can optimize by fetching all questions in one go
    const questionIds = responses.map(r => r.questionId);
    const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: { options: true }
    });

    // Process responses
    // We need to store student responses in DB as well

    const responseData: any[] = [];

    for (const resp of responses) {
        const question = questions.find(q => q.id === resp.questionId);
        if (question) {
            const selectedOption = question.options.find(o => o.id === resp.selectedOptionId);
            if (selectedOption && selectedOption.isCorrect) {
                score += question.marks;
            }
            responseData.push({
                attemptId,
                questionId: resp.questionId,
                selectedOptionId: resp.selectedOptionId
            });
        }
    }

    // Transaction: Update attempt and save responses
    await prisma.$transaction(async (tx) => {
        await tx.studentResponse.createMany({
            data: responseData
        });

        await tx.quizAttempt.update({
            where: { id: attemptId },
            data: {
                status: AttemptStatus.SUBMITTED,
                endTime: new Date(),
                score
            }
        });
    });

    return { message: 'Quiz submitted successfully', score, totalMarks: attempt.quiz.totalMarks };
};

export default {
    listAvailableQuizzes,
    startAttempt,
    submitAttempt,
};
