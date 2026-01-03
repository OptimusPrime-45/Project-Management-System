import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default", 
        product: {
            name: "Task Manager",
            link: "https://taskmanagelink.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHtml = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    }

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email sending failed. Make sure Mailtrap credentials are correct.");
        console.error("Error: ",error);
    }
}

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome! We're excited to have you on board.",
            action: {
                instructions:
                    "To get started, please verify your email address by clicking the button below:",
                button: {
                    color: "#22BC66",
                    text: "Verify Email",
                    link: verificationUrl,
                },
            },
            outro: "Need help? Just reply to this email, we're always here for you.",
        },
    };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We received a request to reset your password.",
            action: {
                instructions:
                    "To get started, please click the button below to reset your password:",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help? Just reply to this email, we're always here for you.",
        },
    };
};

export { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendMail };