import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Transporter, createTransport } from "nodemailer";
import { generateTemplate } from "../mail/template";
import path from "path";

class Email {
  private transportOptions: SMTPTransport.Options;
  private transporter: Transporter;
  private to: string;
  private from: string;
  private welcomeMessage: string;
  private forgetPassword: string;

  constructor(name: string, email: string) {
    this.transportOptions = {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    };
    this.transporter = createTransport(this.transportOptions);
    this.to = email;
    this.from = `SoundSphere <${process.env.EMAIL_FROM}>`;
    this.welcomeMessage = `Hi ${name}, welcome to SoundSphere! There are so much things that we do for verified users. Use the given OTP to verify your email.`;
    this.forgetPassword = `We just received a request that you forgot your password. No problem, you can use the link below and create brand new password.`;
  }

  private generateWelcomeMailOptions(verificationToken: string) {
    return {
      to: this.to,
      from: this.from,
      subject: "SoundSphere - Welcome!",
      html: generateTemplate({
        title: "Welcome to SoundSphere",
        message: this.welcomeMessage,
        logo: "cid:logo",
        banner: "cid:welcome",
        link: "#",
        btnTitle: verificationToken,
      }),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../mail/images/logo.png"),
          cid: "logo",
        },
        {
          filename: "welcome.png",
          path: path.join(__dirname, "../mail/images/welcome.png"),
          cid: "welcome",
        },
      ],
    };
  }

  private generateForgetPasswordMailOptions(link: string) {
    return {
      to: this.to,
      from: this.from,
      subject: "SoundSphere - Reset Password Link!",
      html: generateTemplate({
        title: "Forget Password",
        message: this.welcomeMessage,
        logo: "cid:logo",
        banner: "cid:welcome",
        link,
        btnTitle: "Reset Password",
      }),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../mail/images/logo.png"),
          cid: "logo",
        },
        {
          filename: "welcome.png",
          path: path.join(__dirname, "../mail/images/welcome.png"),
          cid: "welcome",
        },
      ],
    };
  }

  private generatePasswordResetSuccessMailOptions() {
    return {
      to: this.to,
      from: this.from,
      subject: "SoundSphere - Pasword Reset Successfully!",
      html: generateTemplate({
        title: "Pasword Reset Successfully",
        message: this.welcomeMessage,
        logo: "cid:logo",
        banner: "cid:welcome",
        link: process.env.SIGN_IN_URL ?? "",
        btnTitle: "Reset Password",
      }),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../mail/images/logo.png"),
          cid: "logo",
        },
        {
          filename: "welcome.png",
          path: path.join(__dirname, "../mail/images/welcome.png"),
          cid: "welcome",
        },
      ],
    };
  }

  //TODO use pug to create emails html
  async sendWelcome(verificationToken: string) {
    this.transporter.sendMail(
      this.generateWelcomeMailOptions(verificationToken)
    );
  }

  async sendForgetPasswordLink(link: string) {
    this.transporter.sendMail(this.generateForgetPasswordMailOptions(link));
  }

  async sendPasswordResetSuccess() {
    this.transporter.sendMail(this.generatePasswordResetSuccessMailOptions());
  }
}

export { Email };
