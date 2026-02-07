import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Layout, Shield, Users, Zap, BarChart3, Globe, Clock } from "lucide-react";
import landingImage from "../assets/landingPageImage.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 transition-all duration-300 glass bg-background/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Layout className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white/90">
                Project Flow
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <main className="flex-grow">
        <div className="relative isolate min-h-screen flex items-center justify-center">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 -z-20">
            <img
              src={landingImage}
              alt="Background"
              className="h-full w-full object-cover"
            />
          </div>
          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-background"></div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
            <div className="mx-auto max-w-2xl animate-fade-in-up">
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-white/20 hover:ring-white/40 transition-all duration-300 bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20">
                  <span className="font-semibold text-primary-400">New feature</span>
                  <span className="mx-2 text-gray-400">|</span>
                  Advanced Project Analytics
                  <Link to="/register" className="ml-2 font-semibold text-primary-400">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Learn more <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-7xl drop-shadow-sm animate-fade-in-up pb-2" style={{ animationDelay: '0.1s' }}>
                Manage projects with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                  unmatched efficiency
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto animate-fade-in-up drop-shadow-md" style={{ animationDelay: '0.2s' }}>
                Streamline workflows, collaborate in real-time, and ship faster. The all-in-one platform built for high-performance teams who demand excellence.
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <Link
                  to="/register"
                  className="rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex items-center gap-2"
                >
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="py-24 sm:py-32 relative overflow-hidden bg-background">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
            <div className="mx-auto max-w-2xl lg:text-center animate-fade-in-up">
              <h2 className="text-base font-semibold leading-7 text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">Deploy faster</h2>
              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">manage projects</span>
              </p>
              <p className="mt-6 text-lg leading-8 text-foreground-secondary">
                From task tracking to team collaboration, we provide the tools you need to succeed in today's fast-paced environment.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: "Real-time Collaboration",
                    description:
                      "Work together with your team in real-time. See changes as they happen and communicate instantly.",
                    icon: Users,
                    color: "bg-blue-500",
                  },
                  {
                    name: "Secure & Reliable",
                    description:
                      "Enterprise-grade security to keep your data safe. Regular backups and 99.9% uptime guarantee.",
                    icon: Shield,
                    color: "bg-green-500",
                  },
                  {
                    name: "Automated Workflows",
                    description:
                      "Save time with powerful automation. Create custom rules to handle repetitive tasks automatically.",
                    icon: Zap,
                    color: "bg-yellow-500",
                  },
                  {
                    name: "Advanced Reporting",
                    description:
                      "Gain insights into your team's performance with detailed analytics and customizable reports.",
                    icon: BarChart3,
                    color: "bg-purple-500",
                  },
                  {
                    name: "Global Accessibility",
                    description:
                      "Access your projects from anywhere in the world. Our platform is optimized for all devices.",
                    icon: Globe,
                    color: "bg-indigo-500",
                  },
                  {
                    name: "Time Tracking",
                    description:
                      "Keep track of time spent on tasks and projects to ensure you stay on schedule and within budget.",
                    icon: Clock,
                    color: "bg-pink-500",
                  },
                ].map((feature, index) => (
                  <div key={feature.name} className="flex flex-col group relative bg-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                      <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${feature.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                        <feature.icon className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-foreground-secondary pl-13">
                      <p className="flex-auto">{feature.description}</p>
                      <p className="mt-4">
                        <Link to="/register" className="text-sm font-semibold leading-6 text-primary group-hover:text-primary-hover transition-colors flex items-center gap-1">
                          Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative isolate mt-16 px-6 py-24 sm:mt-24 sm:px-24 xl:px-48 mx-auto max-w-7xl">
          <div className="relative isolate overflow-hidden bg-primary px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16 overflow-hidden">
            {/* Background effects for CTA */}
            <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl" aria-hidden="true">
              <div className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25" style={{ clipPath: 'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)' }}></div>
            </div>

            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Boost your productivity today.
              <br />
              Start using PMS for free.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
              Join thousands of teams who have transformed how they work. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-primary shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <Link to="/login" className="text-sm font-semibold leading-6 text-white group flex items-center gap-1 hover:text-white/80 transition-colors">
                Log in <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-background border-t border-border mt-24 py-12 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-foreground tracking-tight">PMS</span>
            </div>

            <div className="flex gap-8 mb-8">
              {['Product', 'Features', 'Pricing', 'Company', 'Blog'].map((item) => (
                <a key={item} href="#" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <p className="text-center text-xs leading-5 text-foreground-muted">
              &copy; 2024 Project Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
