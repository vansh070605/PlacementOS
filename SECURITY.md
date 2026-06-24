# Security Policy

## Supported Versions

We take security seriously at PlacementOS. We currently support security updates for the following versions of the project. We strongly recommend always using the latest stable release.

| Version | Supported          | Description                     |
| ------- | ------------------ | ------------------------------- |
| >= 1.0.0| :white_check_mark: | Currently supported             |
| < 1.0.0 | :x:                | Pre-release (Unsupported)       |

## Reporting a Vulnerability

If you discover a security vulnerability within PlacementOS, please **do not open a public issue**. Instead, follow our responsible disclosure process:

1. **Email us:** Send a detailed email to [security@placementos.example.com](mailto:security@placementos.example.com).
2. **Details:** Include a clear description of the vulnerability, the steps required to reproduce it, and any potential impact.
3. **Response:** We will acknowledge receipt of your vulnerability report within **48 hours**.

## Responsible Disclosure

We ask that you follow these guidelines when reporting a vulnerability:
- Do not exploit the vulnerability beyond what is necessary to confirm its existence.
- Do not publicly disclose the vulnerability until we have had a reasonable amount of time to release a patch (typically 90 days).
- Do not attempt to access, modify, or delete data belonging to other users.

## Security Best Practices

To ensure the security of your Deployment of PlacementOS:
- Always use environment variables for secrets (e.g., `JWT_SECRET`, `OPENAI_API_KEY`, `MONGO_URI`). **Never commit `.env` files.**
- Ensure your MongoDB instance is secured with authentication and is not publicly exposed to the internet.
- Keep Node.js and all npm dependencies updated to their latest secure versions.
- Enable HTTPS on your production deployment.

## Response Timeline

- **Acknowledgement:** Within 48 hours of your report.
- **Triage & Validation:** Within 7 days.
- **Patch Development:** Priority depends on the severity. Critical patches will be released as soon as possible.
- **Disclosure:** We will publish a security advisory and notify users once the patch is released.

Thank you for helping to keep PlacementOS secure!
