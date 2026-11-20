import { Resend } from 'resend';
import { render } from 'svelte-email';
import EmailWelcomeUser from '../../lib/components/EmailWelcomeUser.svelte';
import Emailforgotpassword from '../../lib/components/Emailforgotpassword.svelte';
import EmailChangePasswordUser from '../../lib/components/EmailChangePasswordUser.svelte';

import { ComponentType } from 'svelte';
import Emailforgotpassword__SvelteComponent_ from '../../lib/components/Emailforgotpassword.svelte';

export async function sendEmailVerify(email: string, name: string, id: string, type: string) {
  let component!: ComponentType<Emailforgotpassword__SvelteComponent_>;
  let Subject;

  switch (type) {
    case 'forgotpassword':
      component = Emailforgotpassword;
      Subject = 'Reset your password – Cuepoint';
      break;

    case 'welcomeEmail':
      component = EmailWelcomeUser;
      Subject = `Welcome ${name} – Cuepoint`;
      break;

    case 'changePasswordEmail':
      component = EmailChangePasswordUser;
      Subject = `Password Reset Request – Cuepoint`;
      break;

    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any
  const html = render<any>({
    template: component,
    props: {
      id: id,
    },
  });

  const resend = new Resend(process.env.APP_RESEND_EMAIL_KEY);

  const options = {
    from: process.env.APP_RESEND_EMAIL_FROM as string,
    to: email,
    subject: Subject as string,
    html: html,
  };
  const { data, error } = await resend.emails.send(options);

  if (error) {
    return console.error({ error });
  }
}
