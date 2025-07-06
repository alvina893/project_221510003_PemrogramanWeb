import { useState } from "react";
import { NavigationBar } from "./components/NavigationBar";
import { Routes, Route } from "react-router-dom";
import { UserAuthForm } from "./components/UserAuthForm";
import { Home } from "./components/Home";
import { Separator } from "./components/Separator";
import { LikedPatternsPage } from "./components/LikedPatternsPage";
import { Toast } from "./components/Toast";
import { MyPatternsPage } from "./components/MyPatternsPage";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => setToast(msg);

  return (
    <main>
      <Toast message={toast} onClose={() => setToast("")} />
      <NavigationBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <Routes>
        <Route path="/" element={<Home showToast={showToast} searchTerm={searchTerm} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />} />
        <Route path="signin" element={<UserAuthForm type="Sign-In" />} />
        <Route path="signup" element={<UserAuthForm type="Sign-Up" />} />
        <Route path="liked-patterns" element={<LikedPatternsPage showToast={showToast} selectedCategory={selectedCategory} searchTerm={searchTerm} />} />
        <Route path="/mypatterns" element={<MyPatternsPage showToast={showToast} selectedCategory={selectedCategory} searchTerm={searchTerm} />} />
      </Routes>
    </main>
  );
};

export default App;
