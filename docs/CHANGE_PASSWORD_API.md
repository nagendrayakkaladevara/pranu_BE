# Change Password API

Documentation for the change password endpoint. Share this with the frontend team for integration.

---

## Endpoint

| Method | Path                       | Auth Required      |
| :----- | :------------------------- | :----------------- |
| `POST` | `/v1/auth/change-password` | Yes (Bearer token) |

**Base URL:** `http://localhost:4000/v1` (or your deployed API URL)

---

## Access Control

| Role         | Allowed            |
| :----------- | :----------------- |
| **STUDENT**  | Yes                |
| **LECTURER** | Yes                |
| **ADMIN**    | No (403 Forbidden) |

Admins must use `PATCH /v1/auth/me` with `{ "password": "newPassword" }` to change their password.

---

## Request

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Body

| Field             | Type   | Required | Description                     |
| :---------------- | :----- | :------- | :------------------------------ |
| `currentPassword` | string | Yes      | User's current password         |
| `newPassword`     | string | Yes      | New password (min 8 characters) |

### Example

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

---

## Response

### Success

**Status:** `204 No Content`  
**Body:** Empty

### Error Responses

| Status | Code              | Message                                                | When                                              |
| :----- | :---------------- | :----------------------------------------------------- | :------------------------------------------------ |
| 401    | Unauthorized      | `Please authenticate`                                  | Missing or invalid Bearer token                   |
| 401    | Unauthorized      | `Current password is incorrect`                        | Wrong `currentPassword`                           |
| 401    | Unauthorized      | `User not found`                                       | User no longer exists                             |
| 401    | Unauthorized      | `Account is deactivated`                               | User is soft-deleted                              |
| 403    | Forbidden         | `Forbidden`                                            | Admin role tried to use this endpoint             |
| 400    | Bad Request       | `New password must be different from current password` | `newPassword` equals `currentPassword`            |
| 400    | Bad Request       | `New password must be at least 8 characters`           | `newPassword` too short                           |
| 400    | Bad Request       | `Current password is required`                         | Missing `currentPassword`                         |
| 429    | Too Many Requests | —                                                      | Rate limit exceeded (20 auth requests per 15 min) |

---

## Frontend Integration Example

```javascript
// Change password
async function changePassword(currentPassword, newPassword) {
  const response = await fetch(`${API_BASE_URL}/v1/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  if (response.status === 204) {
    return { success: true };
  }

  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || 'Failed to change password');
}
```

---

## Validation Rules

| Field             | Rule                                     |
| :---------------- | :--------------------------------------- |
| `currentPassword` | Required, non-empty                      |
| `newPassword`     | Required, minimum 8 characters           |
| `newPassword`     | Must be different from `currentPassword` |

---

## UI Recommendations

1. **Show current password field** – Required for security.
2. **Confirm new password** – Validate `newPassword` and `confirmNewPassword` match on the frontend before calling the API.
3. **Handle 401** – On "Current password is incorrect", prompt the user to re-enter their current password.
4. **Handle 403** – If the user is an admin, redirect them to a different flow (e.g. profile update).
5. **Success feedback** – Clear the form and show a success message after 204.
