"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Target, Flame } from "lucide-react";

const progressData = [
  { day: 'Mon', score: 20 },
  { day: 'Tue', score: 35 },
  { day: 'Wed', score: 45 },
  { day: 'Thu', score: 60 },
  { day: 'Fri', score: 80 },
  { day: 'Sat', score: 85 },
  { day: 'Sun', score: 100 },
];

export default function Dashboard() {
  const [subjectCount, setSubjectCount] = useState(0);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiUrl}/subjects/`)
      .then(res => res.json())
      .then(data => {
        setSubjectCount(data.length);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, User!</h2>
        <p className="text-gray-400 mt-1">Here is what's happening with your learning journey today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Widget title="Streak" value="12 Days" icon={<Flame className="h-5 w-5 text-orange-500" />} subtext="Keep it up!" />
        <Widget title="Job Readiness" value="85%" icon={<Target className="h-5 w-5 text-green-500" />} subtext="Highest: Python Dev" />
        <Widget title="Hours Learned" value="24.5h" icon={<Calendar className="h-5 w-5 text-blue-500" />} subtext="This month" />
        <Widget title="Active Subjects" value={`${subjectCount} Topics`} icon={<TrendingUp className="h-5 w-5 text-purple-500" />} subtext="Being tracked actively" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Learning Progress Overview</h3>
            <p className="text-sm text-gray-400">Your performance over the last 7 days</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Today's Plan</h3>
            <p className="text-sm text-gray-400">AI suggested topics based on your weaknesses</p>
          </div>
          <div className="space-y-4 pt-2">
            <PlanItem title="Review Python OOP" time="45 mins" type="Weakness" />
            <PlanItem title="Complete React Hooks" time="60 mins" type="In Progress" />
            <PlanItem title="SQL Joins Quiz" time="15 mins" type="Assessment" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Widget({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="tracking-tight text-sm font-medium text-gray-400">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function PlanItem({ title, time, type }: { title: string, time: string, type: string }) {
  const typeColors: Record<string, string> = {
    'Weakness': 'bg-red-500/10 text-red-500',
    'In Progress': 'bg-blue-500/10 text-blue-500',
    'Assessment': 'bg-purple-500/10 text-purple-500',
  };
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-950">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`px-2 py-1 text-xs rounded-md ${typeColors[type] || 'bg-gray-800'}`}>
        {type}
      </span>
    </div>
  );
}
