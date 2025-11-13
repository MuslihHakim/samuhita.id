/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{js,jsx}',
      './components/**/*.{js,jsx}',
      './app/**/*.{js,jsx}',
      './src/**/*.{js,jsx}',
    ],
    prefix: "",
    theme: {
    	container: {
    		center: true,
    		padding: {
    			DEFAULT: '1rem',
    			sm: '1.5rem',
    			lg: '2rem',
    			xl: '2rem',
    			'2xl': '2rem'
    		},
    		screens: {
    			'xs': '475px',
    			'sm': '640px',
    			'md': '768px',
    			'lg': '1024px',
    			'xl': '1200px',
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			},
    			// Custom semantic colors for better consistency
    			success: {
    				DEFAULT: 'hsl(var(--success))',
    				foreground: 'hsl(0 0% 98%)'
    			},
    			warning: {
    				DEFAULT: 'hsl(var(--warning))',
    				foreground: 'hsl(0 0% 98%)'
    			},
    			info: {
    				DEFAULT: 'hsl(var(--info))',
    				foreground: 'hsl(0 0% 98%)'
    			},
    			// Professional shades for specific use cases
    			navy: {
    				50: '#f8fafc',
    				100: '#f1f5f9',
    				200: '#e2e8f0',
    				300: '#cbd5e1',
    				400: '#94a3b8',
    				500: '#64748b',
    				600: '#475569',
    				700: '#334155',
    				800: '#1e293b',
    				900: '#0f172a',
    				950: '#020617'
    			},
    			teal: {
    				50: '#f0fdfa',
    				100: '#ccfbf1',
    				200: '#99f6e4',
    				300: '#5eead4',
    				400: '#2dd4bf',
    				500: '#14b8a6',
    				600: '#0d9488',
    				700: '#0f766e',
    				800: '#115e59',
    				900: '#134e4a',
    				950: '#042f2e'
    			}
    		},
    		// Custom max-width utilities for better responsive control
    		maxWidth: {
    			'7xl': '80rem',
    			'8xl': '88rem',
    			'9xl': '96rem',
    			'container-md': '720px',
    			'container-lg': '960px',
    			'container-xl': '1140px'
    		},
    		// Custom spacing for better responsive transitions
    		spacing: {
    			'18': '4.5rem',
    			'88': '22rem',
    			'128': '32rem',
    			'144': '36rem'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
  }