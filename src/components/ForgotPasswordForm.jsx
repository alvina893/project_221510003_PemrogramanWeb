import React, { useState } from "react";
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setMessage("Failed to send reset email: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="form-authentication w-[80%] max-w-[550px] mx-auto bg-white/90 rounded-2xl py-8 shadow flex flex-col items-center justify-center align-middle min-h-[350px]">
      <h2 className="text-2xl font-bold text-primary mb-6">Forgot Password</h2>
      <form className="w-full flex flex-col items-center" onSubmit={handleReset}>
        <label htmlFor="reset-email" className="text-primary text-base font-medium mb-2 w-full text-left">Email Address</label>
        <input
          id="reset-email"
          type="email"
          className="w-full mb-4 px-4 py-2 border border-primary rounded bg-white text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-secondary"
          placeholder="Enter your email to reset password"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="btn-light w-full text-sm mb-2"
          disabled={loading}
        >
          {loading ? "Sending..." : "Reset Password"}
        </button>
        {message && (
          <div className="text-xs text-center mt-1 text-primary">{message}</div>
        )}
        <button
          type="button"
          className="text-xs underline text-primary mt-4 w-full"
          onClick={onBack}
        >
          Back to Sign In
        </button>
      </form>
    </div>
  );
}; 