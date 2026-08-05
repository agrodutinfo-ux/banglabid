import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopBar, Footer } from "./components/Chrome";
import Home from "./pages/Home";
import Register from "./pages/Register";
import CheckStatus from "./pages/CheckStatus";
import StudentLogin from "./pages/StudentLogin";
import StudentPortal from "./pages/StudentPortal";
import ExamMcq from "./pages/ExamMcq";
import WrittenTest from "./pages/WrittenTest";
import SpellingTest from "./pages/SpellingTest";
import LiveExam from "./pages/LiveExam";
import Leaderboard from "./pages/Leaderboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col font-body">
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/status" element={<PublicLayout><CheckStatus /></PublicLayout>} />
        <Route path="/student/login" element={<PublicLayout><StudentLogin /></PublicLayout>} />
        <Route path="/student" element={<StudentPortal />} />
        <Route path="/leaderboard" element={<PublicLayout><Leaderboard /></PublicLayout>} />

        {/* পরীক্ষার পেজ ইচ্ছাকৃতভাবে সাইট হেডার/ফুটার ছাড়া — ফুলস্ক্রিন এক্সাম মোডের জন্য */}
        <Route path="/exam/mcq" element={<ExamMcq />} />
        <Route path="/exam/written" element={<WrittenTest />} />
        <Route path="/exam/spelling" element={<SpellingTest />} />
        <Route path="/exam/live" element={<LiveExam />} />

        {/* অ্যাডমিন প্যানেল — মূল সাইটের সাথে কোনো লিংক/নেভিগেশন নেই */}
        <Route path="/system-3212/admin-panel/login" element={<AdminLogin />} />
        <Route path="/system-3212/admin-panel" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
