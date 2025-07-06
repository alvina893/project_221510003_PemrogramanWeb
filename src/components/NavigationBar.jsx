import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { DisplayCards } from "./DisplayCards";

export const NavigationBar = ({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("mockUser"));
      if (user && user.username) {
        setUsername(user.username);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      // Optionally handle error
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("mockUser");
    window.location.href = "/";
  };

  return (
    <nav className="flex items-center justify-between py-6 md:px-5 drop-shadow-md bg-white w-full">
      <div className="flex items-center gap-10 flex-grow-0">
        <Link to="/" className="flex-none pl-4">
          <img
            src="https://i.ibb.co/bMDmCXPg/logo2.png"
            className="w-50 hover:scale-105 transition-all"
            alt="aHook&Yarn"
          />
        </Link>
        <div className="hidden xl:flex items-center gap-8 font-semibold">
          <button
            className={`p-3 text-base transition-all cursor-pointer rounded-lg ${
              selectedCategory === "Wearables"
                ? "bg-primary text-white"
                : "text-primary hover:bg-primary hover:text-white"
            }`}
            onClick={() => setSelectedCategory(selectedCategory === "Wearables" ? "" : "Wearables")}
          >
            <p className="flex items-center">Wearables</p>
          </button>
          <button
            className={`p-3 text-base transition-all cursor-pointer rounded-lg ${
              selectedCategory === "Functional Items"
                ? "bg-primary text-white"
                : "text-primary hover:bg-primary hover:text-white"
            }`}
            onClick={() => setSelectedCategory(selectedCategory === "Functional Items" ? "" : "Functional Items")}
          >
            <p className="flex items-center">Functional Items</p>
          </button>
          <button
            className={`p-3 text-base transition-all cursor-pointer rounded-lg ${
              selectedCategory === "Toys & Gifts"
                ? "bg-primary text-white"
                : "text-primary hover:bg-primary hover:text-white"
            }`}
            onClick={() => setSelectedCategory(selectedCategory === "Toys & Gifts" ? "" : "Toys & Gifts")}
          >
            <p className="flex items-center">Toys & Gifts</p>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-8 md:gap-4 flex-grow-0 justify-end pr-4">
        {username && (
          <Link
            to="/mypatterns"
            className="px-4 py-2 rounded bg-pink-50 text-primary border border-primary font-semibold hover:bg-primary hover:text-white transition-all whitespace-nowrap hidden md:inline-block ml-4"
          >
            My Patterns
          </Link>
        )}
        <div className="relative hidden md:flex items-center gap-3">
          <i className="fi fi-br-search absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg flex items-center"></i>
          <input
            type="text"
            placeholder="Search for Patterns..."
            className="w-full appearance-none outline-none pl-10 p-2 rounded-lg text-primary bg-pink-50 placeholder-primary min-w-[180px] border border-primary"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {username && (
            <div className="relative ml-4">
              <button
                className="font-bold text-lg px-3 py-1 rounded bg-pink-50 text-primary shadow-md border border-primary flex items-center gap-2 focus:outline-none"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                {username}
                <i className={`fi fi-rr-angle-${dropdownOpen ? "up" : "down"} text-base`}></i>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-primary rounded shadow-lg z-50">
                  <Link
                    to="/liked-patterns"
                    className="block px-4 py-2 text-primary hover:bg-pink-50 hover:text-primary transition-all"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Liked Patterns
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-primary hover:bg-pink-50 hover:text-red-500 transition-all"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <i
        className="fi fi-br-menu-burger xl:hidden block text-2xl cursor-pointer ml-4 text-primary pr-4"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      ></i>
      <div
        className={`absolute xl:opacity-0 top-24 left-0 w-full flex justify-center z-50 ${
          isMenuOpen ? "block" : "hidden"
        }`}
        style={{ transition: "transform 0.3s ease, opacity 0.3s ease" }}
      >
        <div className="w-full bg-white border border-primary rounded shadow-lg flex flex-col items-stretch font-semibold text-lg py-2">
          <button
            className={`appearance-none w-full px-4 py-3 text-base transition-all rounded text-left ${
              selectedCategory === "Wearables"
                ? "bg-primary text-white"
                : "text-primary hover:bg-pink-50 hover:text-primary"
            }`}
            onClick={() => {
              setSelectedCategory(selectedCategory === "Wearables" ? "" : "Wearables");
              setIsMenuOpen(false);
            }}
          >
            <p>Wearables</p>
          </button>
          <button
            className={`appearance-none w-full px-4 py-3 text-base transition-all rounded text-left ${
              selectedCategory === "Functional Items"
                ? "bg-primary text-white"
                : "text-primary hover:bg-pink-50 hover:text-primary"
            }`}
            onClick={() => {
              setSelectedCategory(selectedCategory === "Functional Items" ? "" : "Functional Items");
              setIsMenuOpen(false);
            }}
          >
            <p>Functional Items</p>
          </button>
          <button
            className={`appearance-none w-full px-4 py-3 text-base transition-all rounded text-left ${
              selectedCategory === "Toys & Gifts"
                ? "bg-primary text-white"
                : "text-primary hover:bg-pink-50 hover:text-primary"
            }`}
            onClick={() => {
              setSelectedCategory(selectedCategory === "Toys & Gifts" ? "" : "Toys & Gifts");
              setIsMenuOpen(false);
            }}
          >
            <p>Toys & Gifts</p>
          </button>
        </div>
      </div>
    </nav>
  );
};
