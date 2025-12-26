module.exports = {
	apps: [
		{
			name: "rvdc-frontend",
			script: "node_modules/next/dist/bin/next",
			args: "start -p 3000",
			cwd: "/srv/rvdc",
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "300M",
			env: {
				NODE_ENV: "production",
				NEXT_PUBLIC_API_BASE_URL: "http://152.42.229.230:8000",
			},
		},
	],
};
