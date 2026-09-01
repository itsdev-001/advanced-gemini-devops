'use client';

import React from 'react';
import { Sparkles, Terminal, Shield, Cloud, ArrowRight, GitBranch } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Kubernetes HPA Architecture',
    prompt: 'Explain how Horizontal Pod Autoscaler (HPA) works in Amazon EKS with CPU and custom Prometheus metrics.',
    icon: <Terminal className="w-5 h-5 text-blue-500" />
  },
  {
    title: 'AWS Terraform Infrastructure',
    prompt: 'Show me the Terraform code structure to create an AWS EKS Cluster with Managed Node Groups and VPC.',
    icon: <Cloud className="w-5 h-5 text-purple-500" />
  },
  {
    title: 'DevSecOps & Trivy Scanning',
    prompt: 'How do we integrate Trivy container vulnerability scanning in GitHub Actions to block critical CVEs?',
    icon: <Shield className="w-5 h-5 text-emerald-500" />
  },
  {
    title: 'Argo CD & GitOps Workflows',
    prompt: 'Explain the GitOps workflow using Argo CD and Helm charts to deploy microservices to Kubernetes.',
    icon: <GitBranch className="w-5 h-5 text-amber-500" />
  }
];

export default function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Badge & Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Advanced Gemini AI Platform</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Hello, DevOps Engineer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Ask complex technical questions, generate cloud infrastructure code, analyze Kubernetes manifests, or debug full-stack applications.
        </p>
      </div>

      {/* Starter Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
        {STARTER_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group p-4 rounded-2xl bg-gray-50 dark:bg-[#1e1f20] hover:bg-gray-100 dark:hover:bg-[#282a2c] border border-gray-200 dark:border-[#333538] hover:border-blue-500/40 cursor-pointer transition-all flex flex-col justify-between space-y-2 shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-white dark:bg-[#282a2c] border border-gray-200 dark:border-[#3b3d40] shadow-sm">
                {item.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {item.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}