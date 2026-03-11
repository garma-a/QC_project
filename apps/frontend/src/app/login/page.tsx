import LoginClient from "./LoginClient";

export default function LoginPage() {
 Refactor_the_frontend_code_Done
  return <LoginClient />;
=======
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [showDemoAccounts, setShowDemoAccounts] = useState(false);
	const { login, currentUser } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const router = useRouter();

	useEffect(() => {
		if (currentUser) {
			router.replace('/dashboard');
		}
	}, [currentUser, router]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!username || !password) {
			setError('Please enter both username and password');
			return;
		}

		const success = login(username, password);
		if (!success) {
			setError('Invalid credentials. Please try again.');
		}
	};

	if (currentUser) {
		return null;
	}

	const fillDemo = (user: 'admin' | 'technician') => {
		if (user === 'admin') {
			setUsername('admin');
			setPassword('admin123');
		} else {
			setUsername('Dr. smith');
			setPassword('password123');
		}
		setError('');
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] flex items-center justify-center p-4 transition-colors duration-300 myc-pattern relative overflow-hidden">
			{/* Decorative background elements - Magdi Yacoub colors */}
			<div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
				<div className="absolute top-20 left-20 w-96 h-96 bg-[#c41e3a] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
				<div className="absolute bottom-20 right-20 w-96 h-96 bg-[#b8860b] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#003366] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
			</div>

			{/* Floating hearts decoration */}
			<div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10">
				<Heart className="absolute top-10 right-1/4 text-[#c41e3a] dark:text-[#e84855]" size={40} fill="currentColor" />
				<Heart className="absolute bottom-20 left-1/4 text-[#c41e3a] dark:text-[#e84855]" size={60} fill="currentColor" />
				<Heart className="absolute top-1/3 left-10 text-[#b8860b] dark:text-[#ffd700]" size={30} fill="currentColor" />
			</div>

			{/* Theme Toggle - Top Right */}
			<button
				onClick={toggleTheme}
				className="fixed top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-xl bg-white dark:bg-[#1e1e1e] shadow-lg hover:shadow-xl transition-all border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 text-gray-600 dark:text-gray-300 hover:border-[#c41e3a] dark:hover:border-[#e84855] z-50"
			>
				{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
			</button>

			<div className="w-full max-w-md relative z-10">
				{/* Logo and Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center mb-6 relative">
						<div className="absolute inset-0 bg-[#b8860b]/20 dark:bg-[#ffd700]/20 rounded-full blur-2xl" />
						<Logo className="relative" />
					</div>
					<h1 className="text-gray-900 dark:text-white mb-2 text-2xl sm:text-3xl font-bold">
						Laboratory Quality Control
					</h1>
					<p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
						Aswan Branch - QC Management System
					</p>
					
					{/* Decorative line */}
					<div className="mt-4 h-1 w-32 mx-auto bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full" />
				</div>

				{/* Login Card - Magdi Yacoub Branded */}
				<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 sm:p-8 transition-colors duration-300 relative overflow-hidden">
					{/* Card header decoration */}
					<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />
					
					<h2 className="text-gray-900 dark:text-white mb-6 text-center text-xl font-bold relative z-10">
						Welcome Back
					</h2>

					{/* Error Message */}
					{error && (
						<div className="mb-6 p-4 rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 flex items-start gap-3 relative z-10">
							<AlertCircle size={20} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5" />
							<p className="text-[#c41e3a] dark:text-[#e84855] text-sm font-medium">{error}</p>
						</div>
					)}

					{/* Login Form */}
					<form onSubmit={handleSubmit} className="space-y-5 relative z-10">
						<div>
							<label htmlFor="username" className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
								Username
							</label>
							<div className="relative">
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
									<User size={20} />
								</div>
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
									placeholder="Enter your username"
									autoComplete="username"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="password" className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
								Password
							</label>
							<div className="relative">
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
									<Lock size={20} />
								</div>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
									placeholder="Enter your password"
									autoComplete="current-password"
								/>
							</div>
						</div>

						<button
							type="submit"
							className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl hover:shadow-[#c41e3a]/30 dark:hover:shadow-[#e84855]/30 flex items-center justify-center gap-2 font-bold text-base ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
						>
							<Lock size={18} />
							Sign In to MYGHC Lab
						</button>
					</form>

					{/* Demo Accounts */}
					<div className="mt-6 pt-6 border-t-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 relative z-10">
						<button
							onClick={() => setShowDemoAccounts(!showDemoAccounts)}
							className="text-sm text-[#b8860b] dark:text-[#ffd700] hover:text-[#c41e3a] dark:hover:text-[#e84855] w-full text-center font-semibold transition-colors"
						>
							{showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
						</button>

						{showDemoAccounts && (
							<div className="mt-4 space-y-2 p-4 rounded-xl bg-[#fff8f0] dark:bg-[#2a2a2a] border border-[#b8860b]/20 dark:border-[#ffd700]/20">
								<div className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center font-medium">
									Click to auto-fill credentials
								</div>
								<button
									onClick={() => fillDemo('admin')}
									className="w-full p-3 rounded-lg bg-white dark:bg-[#1e1e1e] border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 hover:border-[#c41e3a] dark:hover:border-[#e84855] transition-all text-left"
								>
									<div className="font-medium text-gray-900 dark:text-white text-sm">Administrator</div>
									<div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
										Username: <span className="text-[#c41e3a] dark:text-[#e84855] font-mono">admin</span> • Password: <span className="text-[#c41e3a] dark:text-[#e84855] font-mono">admin123</span>
									</div>
								</button>
								<button
									onClick={() => fillDemo('technician')}
									className="w-full p-3 rounded-lg bg-white dark:bg-[#1e1e1e] border-2 border-[#003366]/20 dark:border-[#4a90e2]/30 hover:border-[#003366] dark:hover:border-[#4a90e2] transition-all text-left"
								>
									<div className="font-medium text-gray-900 dark:text-white text-sm">Technician Demo</div>
									<div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
										Username: <span className="text-[#003366] dark:text-[#4a90e2] font-mono">Dr. smith</span> • Password: <span className="text-[#003366] dark:text-[#4a90e2] font-mono">password123</span>
									</div>
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
					<p>© 2025 Magdi Yacoub Heart Center • Aswan Branch</p>
					<p className="mt-1 text-[#b8860b] dark:text-[#ffd700]">Laboratory Quality Control System</p>
				</div>
			</div>
		</div>
	);
}
