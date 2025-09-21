"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

// SVG Icon Components for better readability
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const SignOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      setLoading(true);
      axios
        .get("https://api.github.com/user/repos", {
          headers: {
            Authorization: `token ${session.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
          params: {
            type: "all",
            per_page: 100,
          },
        })
        .then((response) => {
          const sortedRepos = response.data.sort(
            (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)
          );
          setRepos(sortedRepos);
          setFilteredRepos(sortedRepos);
          setError(null);
        })
        .catch((err) => {
          setError("Failed to fetch repositories. Please try again later.");
          console.error("Error fetching repositories:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (status === "unauthenticated") {
       setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    setFilteredRepos(
      repos.filter((repo) =>
        repo.full_name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, repos]);

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo === selectedRepo ? null : repo);
  };

  const handleAnalyze = () => {
    if (selectedRepo) {
      // Placeholder for future implementation
      alert(`Analyzing repository: ${selectedRepo.full_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Animated Gradient Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold tracking-tighter text-white animate-pulse">
                Akira AI
              </h1>
            </div>
            {session && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden sm:block">
                  {session.user?.name}
                </span>
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white/20"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-red-500/50 transition-all duration-300"
                  title="Sign Out"
                >
                  <SignOutIcon />
                  <span className="hidden md:block">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Repositories List */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Select a Repository
              </h2>
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search your repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 pl-10 bg-white/5 border border-white/10 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {status === "loading" || loading ? (
                 <div className="text-center p-8">Loading repositories...</div>
              ) : error ? (
                <div className="text-center p-8 text-red-400">{error}</div>
              ) : filteredRepos.length > 0 ? (
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredRepos.map((repo) => (
                    <li
                      key={repo.id}
                      className={`p-4 border border-transparent rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:border-indigo-500/50 ${
                        selectedRepo?.id === repo.id
                          ? "bg-indigo-500/30 border-indigo-500"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => handleSelectRepo(repo)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          {repo.full_name}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            repo.private
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-8 text-gray-400">No repositories found.</div>
              )}
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-8">
            {/* Analysis Section */}
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Analysis
              </h2>
              {selectedRepo ? (
                 <div>
                   <p className="mb-4">
                     Ready to analyze:{" "}
                     <span className="font-bold text-indigo-400">{selectedRepo.full_name}</span>
                   </p>
                    <button
                      onClick={handleAnalyze}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300"
                    >
                      Run AI Analysis
                    </button>
                 </div>
              ) : (
                <p className="text-gray-400">
                  Select a repository from the list to begin analysis.
                </p>
              )}
            </div>

            {/* Chats Section */}
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-white">Chats</h2>
              <Link
                href="/chat"
                className="inline-block w-full text-center px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
              >
                + Start a New Chat
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}