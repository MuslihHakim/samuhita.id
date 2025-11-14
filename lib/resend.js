import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;

export function getCredentialsEmailTemplate(name, username, password) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Credentials - Samuhita.id</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 20px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></svg>') repeat;
          opacity: 0.1;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .header h1 {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          position: relative;
          z-index: 1;
        }

        .content {
          padding: 40px 30px;
        }

        .welcome-message {
          text-align: center;
          margin-bottom: 32px;
        }

        .welcome-message h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .welcome-message p {
          color: #64748b;
          font-size: 16px;
        }

        .credentials-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          position: relative;
        }

        .credentials-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1e3a8a 0%, #0d9488 100%);
          border-radius: 12px 12px 0 0;
        }

        .credentials-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .credential-item {
          margin-bottom: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .credential-item:last-child {
          margin-bottom: 0;
        }

        .credential-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .credential-value {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 18px;
          font-weight: 600;
          color: #1e3a8a;
          background: white;
          padding: 12px 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          word-break: break-all;
        }

        .security-notice {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #f59e0b;
          margin-bottom: 32px;
        }

        .security-notice h3 {
          color: #92400e;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .security-notice p {
          color: #78350f;
          font-size: 14px;
          line-height: 1.5;
        }

        .action-button {
          text-align: center;
          margin-bottom: 32px;
        }

        .action-button a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .action-button a:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .footer {
          background: #f8fafc;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }

        .footer p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .footer .footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }

        .footer-links a {
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: #1e3a8a;
        }

        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 12px;
          }

          .header {
            padding: 30px 20px;
          }

          .header h1 {
            font-size: 24px;
          }

          .content {
            padding: 30px 20px;
          }

          .credentials-card {
            padding: 24px 20px;
          }

          .credential-item {
            padding: 16px;
          }

          .credential-value {
            font-size: 16px;
            padding: 10px 12px;
          }

          .footer .footer-links {
            flex-direction: column;
            gap: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fill-opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="logo-text">Samuhita.id</div>
          </div>
          <h1>Your Account is Ready!</h1>
          <p>Welcome to your gateway to international career opportunities</p>
        </div>

        <div class="content">
          <div class="welcome-message">
            <h2>Hello ${name},</h2>
            <p>Your account has been successfully created. Here are your login credentials to access your dashboard.</p>
          </div>

          <div class="credentials-card">
            <div class="credentials-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14L9 11L12 8L15 11L12 14Z" fill="#1e3a8a"/>
                <path d="M12 2C12.5523 2 13 2.44772 13 3V5C13 5.55228 12.5523 6 12 6C11.4477 6 11 5.55228 11 5V3C11 2.44772 11.4477 2 12 2Z" fill="#1e3a8a"/>
                <path d="M12 18C12.5523 18 13 18.4477 13 19V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19C11 18.4477 11.4477 18 12 18Z" fill="#1e3a8a"/>
                <path d="M19 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H19C18.4477 13 18 12.5523 18 12C18 11.4477 18.4477 11 19 11Z" fill="#1e3a8a"/>
                <path d="M3 11H5C5.55228 11 6 11.4477 6 12C6 12.5523 5.55228 13 5 13H3C2.44772 13 2 12.5523 2 12C2 11.4477 2.44772 11 3 11Z" fill="#1e3a8a"/>
              </svg>
              Login Credentials
            </div>

            <div class="credential-item">
              <div class="credential-label">Username</div>
              <div class="credential-value">${username}</div>
            </div>

            <div class="credential-item">
              <div class="credential-label">Password</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>

          <div class="security-notice">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#f59e0b"/>
              </svg>
              Important Security Notice
            </h3>
            <p>Please keep these credentials secure and do not share them with anyone. You'll need them to log in and complete your CV information for international job applications.</p>
          </div>

          <div class="action-button">
            <a href="https://samuhita.id/login" target="_blank">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 16L8 13L11 10M8 13H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Access Your Dashboard
            </a>
          </div>
        </div>

        <div class="footer">
          <p>If you didn't request this account, please contact our support team immediately.</p>
          <p>&copy; ${new Date().getFullYear()} Samuhita.id. All rights reserved.</p>
          <div class="footer-links">
            <a href="https://samuhita.id">Website</a>
            <a href="mailto:support@samuhita.id">Support</a>
            <a href="https://samuhita.id/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
