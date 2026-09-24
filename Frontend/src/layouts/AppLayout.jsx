import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../lib/router';
import { useTheme } from '../lib/theme';
import { useNotifications } from '../lib/notifications';
import { Avatar } from '../components/ui/Avatar';
import { currentUser, currentOrganization } from '../data/mockData';

export function AppLayout({ children }) {
  const { path, navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signOutToast, setSignOutToast] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/dashboard',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )
        },
        {
          id: 'requests',
          label: 'Service Requests',
          path: '/requests',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          id: 'jobs',
          label: 'Service Jobs',
          path: '/jobs',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          id: 'technicians',
          label: 'Technicians',
          path: '/technicians',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        {
          id: 'customers',
          label: 'Customers',
          path: '/customers',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        },
        {
          id: 'assets',
          label: 'Assets',
          path: '/assets',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/reports',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        }
      ]
    }
  ];

  const handleSignOutMock = () => {
    setProfileDropdownOpen(false);
    setSignOutToast(true);
    setTimeout(() => setSignOutToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Mock Sign Out Toast */}
      {signOutToast && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <span>ℹ</span>
          <span>Mock Sign Out: Session preserved for preview.</span>
        </div>
      )}

      {/* Top Application Header Bar */}
      <header className="h-16 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-5">
        {/* Brand & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-sm shadow-blue-500/30">
              SF
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ServiceForge <span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
          </div>
        </div>

        {/* Center / Right Header Search & Utility Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400 w-64">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search requests, jobs, assets..." 
              className="bg-transparent border-none outline-none text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
            />
          </div>

          {/* Organization Switcher Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currentOrganization.name}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>

          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-extrabold text-white bg-rose-500 rounded-full shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markAsRead(item.id);
                        if (item.link) navigate(item.link);
                        setNotificationsOpen(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3 ${
                        !item.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      <span className="mt-0.5 text-base">
                        {item.type === 'warning' ? '⚠️' : item.type === 'ai' ? '🤖' : '💬'}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${!item.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-950/40">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/settings');
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Switch (Placed at Left Side of Profile Dropdown matching screenshot) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <span className="text-base">🌙</span>
                <span className="hidden sm:inline text-xs">Dark</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <span className="text-base">☀</span>
                <span className="hidden sm:inline text-xs">Light</span>
              </span>
            )}
          </button>

          {/* User Profile Dropdown Container */}
          <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
            <div 
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors select-none"
            >
              <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="sm" />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                  Service Manager
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Profile Dropdown Menu matching Image 1 mockup */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header Info */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center gap-3">
                  <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="md" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{currentUser.fullName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Service Manager</div>
                  </div>
                </div>

                {/* Options List */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                  >
                    <span className="text-base">👤</span>
                    <div>
                      <div className="font-bold leading-snug">Profile</div>
                      <div className="text-[10px] text-slate-500 font-normal">View your profile</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                  >
                    <span className="text-base">⚙️</span>
                    <div>
                      <div className="font-bold leading-snug">Settings</div>
                      <div className="text-[10px] text-slate-500 font-normal">Preferences & configuration</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setNotificationsOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                  >
                    <span className="text-base">🎧</span>
                    <div>
                      <div className="font-bold leading-snug">Support</div>
                      <div className="text-[10px] text-slate-500 font-normal">Get help & documentation</div>
                    </div>
                  </button>
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSignOutMock}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold transition-colors text-left"
                  >
                    <span className="text-base">🚪</span>
                    <div>
                      <div className="font-bold leading-snug">Sign Out</div>
                      <div className="text-[10px] text-rose-500/80 font-normal">Log out of your account</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Area: Sidebar & Page Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar Navigation matching image screenshots */}
        <aside className="hidden md:flex flex-col w-60 border-r border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 p-4 space-y-4 shrink-0">
          {/* Navigation Items */}
          <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Bottom Utility Area matching design images */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shrink-0">
            {/* 1. Interactive Theme Switch Pill matching mockup */}
            <div 
              onClick={toggleTheme}
              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer select-none shadow-2xs hover:border-blue-300 transition-colors"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {theme === 'dark' ? '🌙 Dark Mode' : '☀ Light Mode'}
              </span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* 2. Amazon Bedrock Status */}
            <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Amazon Bedrock</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">●</span>
            </div>

            {/* 3. Primary New Service Request Action Button */}
            <button
              onClick={() => navigate('/requests/new')}
              className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>+</span> New Request
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex">
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  ServiceForge AI
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 text-xs p-1">✕</button>
              </div>

              <nav className="flex-1 space-y-4 overflow-y-auto">
                {navSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[9px] font-bold uppercase text-slate-400 px-2">{sec.title}</div>
                    {sec.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold ${
                          path === item.path ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => navigate('/requests/new')}
                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-blue-600 text-white text-center shadow-xs"
                >
                  + New Request
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Operational Workspace Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
