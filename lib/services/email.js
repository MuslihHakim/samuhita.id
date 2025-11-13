import resend, { getCredentialsEmailTemplate } from '../resend';

const DEFAULT_FROM = 'info@bekerjakeluarnegri.com';

export { resend, getCredentialsEmailTemplate };

export async function sendTestCredentialsEmail({ email, name }) {
  if (!email) {
    return {
      status: 400,
      body: { error: 'Email is required' },
    };
  }

  const testName = name || 'Test User';
  const testUsername = 'testuser123';
  const testPassword = 'TestPassword123!';

  try {
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Test: Your BekerjaKeluarNegri.com Login Credentials',
      html: getCredentialsEmailTemplate(testName, testUsername, testPassword),
    });

    if (emailError) {
      console.error('Test email error:', emailError);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Failed to send test email',
          details: emailError,
        },
      };
    }

    console.log('Test email sent successfully to:', email);
    return {
      status: 200,
      body: {
        success: true,
        message: 'Test email sent successfully',
        email,
        emailData,
      },
    };
  } catch (error) {
    console.error('Test email exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}
