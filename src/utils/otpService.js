import nodemailer from 'nodemailer'

const generateOtp = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailOtp = async(email, otp) =>{
    const transporteer = nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporteer.sendMail({
        from: `"Unique Fitness" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Unique Fitness OTP",
        text: `Your OTP is ${otp}. I will expire in 10 minutes`,
        html: `<h2>Your OTP is ${otp}</h2><p>Expires in 10 minutes.</p>`
    });

    console.log(`Email OTP sent to ${email}`)
}

export {
    generateOtp,
    sendEmailOtp
}