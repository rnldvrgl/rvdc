"use client";

import React from "react";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
	Settings,
	Users,
	BarChart3,
	Calendar,
	Plus,
	Download,
	Filter
} from "lucide-react";

export default function PageHeaderShowcase() {
	return (
		<div className="container max-w-7xl mx-auto p-6 space-y-8">
			<h1 className="text-3xl font-bold text-center mb-12">
				PageHeader Component Showcase
			</h1>

			{/* Default Theme Variants */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Default Theme</h2>

				{/* Compact Variant */}
				<div>
					<h3 className="text-lg font-medium mb-4">Compact Variant</h3>
					<PageHeader
						icon={Settings}
						title="Quick Settings"
						description="Manage your basic preferences and configurations."
						variant="compact"
						theme="default"
						breadcrumbs={["Home", "Settings"]}
						actions={
							<Button size="sm">
								<Plus className="size-4 mr-2" />
								Add New
							</Button>
						}
					/>
				</div>

				{/* Default Variant */}
				<div>
					<h3 className="text-lg font-medium mb-4">Default Variant</h3>
					<PageHeader
						icon={Users}
						title="User Management"
						description="Manage user accounts, permissions, and access levels across your organization."
						variant="default"
						theme="default"
						breadcrumbs={["Dashboard", "Admin", "Users"]}
						isAdminOnly
						actions={
							<div className="flex gap-2">
								<Button variant="outline" size="sm">
									<Filter className="size-4 mr-2" />
									Filter
								</Button>
								<Button size="sm">
									<Plus className="size-4 mr-2" />
									Add User
								</Button>
							</div>
						}
					/>
				</div>

				{/* Hero Variant */}
				<div>
					<h3 className="text-lg font-medium mb-4">Hero Variant</h3>
					<PageHeader
						icon={BarChart3}
						title="Analytics Dashboard"
						description="Comprehensive insights and metrics to help you make data-driven decisions for your business growth and performance optimization."
						variant="hero"
						theme="default"
						breadcrumbs={["Dashboard", "Analytics", "Overview"]}
						actions={
							<div className="flex gap-2">
								<Button variant="outline">
									<Download className="size-4 mr-2" />
									Export
								</Button>
								<Button>
									View Reports
								</Button>
							</div>
						}
					/>
				</div>
			</section>

			{/* Primary Theme */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Primary Theme</h2>

				<PageHeader
					icon={Calendar}
					title="Schedule Management"
					description="Organize events, appointments, and important dates with our comprehensive calendar system."
					variant="default"
					theme="primary"
					breadcrumbs={["Dashboard", "Calendar", "Schedule"]}
					actions={
						<Button variant="outline" className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
							<Plus className="size-4 mr-2" />
							New Event
						</Button>
					}
				/>
			</section>

			{/* Secondary Theme */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Secondary Theme</h2>

				<PageHeader
					icon={Settings}
					title="System Configuration"
					description="Configure system-wide settings, preferences, and operational parameters."
					variant="default"
					theme="secondary"
					breadcrumbs={["Admin", "System", "Config"]}
					isAdminOnly
					actions={
						<Button variant="outline" className="bg-secondary-foreground/20 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/30">
							Save Changes
						</Button>
					}
				/>
			</section>

			{/* Accent Theme */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Accent Theme</h2>

				<PageHeader
					icon={BarChart3}
					title="Performance Metrics"
					description="Monitor key performance indicators and track your progress toward business objectives."
					variant="default"
					theme="accent"
					breadcrumbs={["Dashboard", "Reports", "Performance"]}
					actions={
						<div className="flex gap-2">
							<Button variant="outline" className="bg-accent-foreground/20 border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/30">
								Refresh
							</Button>
							<Button className="bg-accent-foreground text-accent hover:bg-accent-foreground/90">
								Generate Report
							</Button>
						</div>
					}
				/>
			</section>

			{/* Without Icons */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Without Icons</h2>

				<PageHeader
					title="Simple Page Header"
					description="Sometimes a clean, minimal approach works best for certain types of content."
					variant="default"
					theme="default"
					breadcrumbs={["Home", "Examples", "Simple"]}
				/>
			</section>

			{/* Minimal Example */}
			<section className="space-y-8">
				<h2 className="text-2xl font-semibold text-center">Minimal Example</h2>

				<PageHeader
					title="Minimal Header"
					variant="compact"
					theme="default"
				/>
			</section>
		</div>
	);
}
