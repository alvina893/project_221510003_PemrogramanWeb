import React, { useState, useRef, useEffect } from "react";
import { InputBox } from "./InputBox";
import { Link, useNavigate } from "react-router-dom";
import { AnimationWrapper } from "../../common/PageAnimation";
import { database, auth } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const UserAuthForm = ({ type }) => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const observerTimeout = setTimeout(() => {
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            navigate("/");
          }
        },
        { threshold: 0.01 }
      );
      if (formRef.current) {
        observer.observe(formRef.current);
      }
      // Cleanup
      return () => {
        if (formRef.current) observer.unobserve(formRef.current);
      };
    }, 600); // 600ms delay to allow scroll into view
    return () => clearTimeout(observerTimeout);
  }, [navigate]);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (type === "Sign-Up") {
      if (!form.username || !form.email || !form.password) {
        alert("Please fill all fields");
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Save username and email to Realtime Database under /users/{uid}
        await set(ref(database, 'users/' + userCredential.user.uid), {
          username: form.username,
          email: form.email
        });
        localStorage.setItem("mockUser", JSON.stringify({ username: form.username, email: form.email, uid: userCredential.user.uid }));
        localStorage.setItem("isLoggedIn", "true");
        alert("Sign up successful! You are now logged in.");
        window.location.href = "/";
      } catch (err) {
        alert('Error signing up: ' + err.message);
      }
      setLoading(false);
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        // Fetch username from Realtime Database
        const userSnap = await get(ref(database, 'users/' + userCredential.user.uid));
        let username = "";
        if (userSnap.exists()) {
          username = userSnap.val().username || "";
        }
        localStorage.setItem("mockUser", JSON.stringify({ username, email: form.email, uid: userCredential.user.uid }));
        localStorage.setItem("isLoggedIn", "true");
        alert("Sign in successful!");
        window.location.href = "/";
      } catch (err) {
        alert('Error signing in: ' + err.message);
      }
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setResetMessage("Failed to send reset email: " + err.message);
    }
  };

  return (
    <section ref={formRef} className="h-cover flex-col bg-secondary">
      <AnimationWrapper keyValue={type}>
        <h1 className="text-4xl font-gelasio capitalize text-center pb-5">
          {type == "Sign-In"
            ? "Welcome back! 😊"
            : "Hello! It's Nice to Meet You! 🥰"}
        </h1>
        <div className="items-center justify-center flex">
          <div className="form-authentication w-[80%] max-w-[550px]">
            {type === "Sign-In" && showReset ? (
              <ForgotPasswordForm onBack={() => setShowReset(false)} />
            ) : (
              <form className="items-center justify-center" onChange={handleChange} onSubmit={handleSubmit}>
                {type != "Sign-In" ? (
                  <InputBox
                    title="Username"
                    name="username"
                    type="text"
                    placeholder="Enter your username here..."
                  />
                ) : (
                  " "
                )}
                <InputBox
                  title="Email"
                  name="email"
                  type="email"
                  placeholder="Enter your email here..."
                />

                <InputBox
                  title="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password here..."
                />
                {type === "Sign-In" && !showReset && (
                  <div className="flex justify-end w-full">
                    <button
                      type="button"
                      className="text-sm text-secondary mb-0 underline hover:text-white focus:outline-none"
                      onClick={() => setShowReset(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-center mb-4 mt-4 w-full gap-3">
                  <button className="btn-light center w-full" disabled={loading}>
                    {type.replace("-", " ")}
                  </button>
                  {loading && (
                    <div className="w-7 h-7 border-4 border-white border-t-primary rounded-full animate-spin"></div>
                  )}
                </div>
                {type == "Sign-In" ? (
                  <p className="mt-6 text-secondary text-l text-center">
                    Don't have an account?
                    <Link
                      to="/signup"
                      className="underline text-amber-300 text-l ml-1"
                    >
                      Join us today!
                    </Link>
                  </p>
                ) : (
                  <p className="mt-6 text-secondary text-l text-center">
                    Already a member?
                    <Link
                      to="/signin"
                      className="underline text-amber-300 text-l ml-1"
                    >
                      Sign in here!
                    </Link>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </AnimationWrapper>
    </section>
  );
};
