import { Handle, Position } from '@xyflow/react';
import { Sparkles, BookOpen, Lock, CheckCircle2, PlayCircle, AlertCircle } from 'lucide-react';

export default function CustomNode({ data }: { data: { label: string; status?: string; isRoot?: boolean } }) {
  const status = data.status || 'locked';

  let Icon = BookOpen;
  let borderColor = "border-gray-800";
  let bgColor = "bg-gray-900";
  let iconColor = "text-gray-500 bg-gray-800/50";
  
  if (status === 'completed') {
    Icon = CheckCircle2;
    borderColor = "border-green-500/50";
    bgColor = "bg-gradient-to-br from-gray-900 to-green-950/20";
    iconColor = "text-green-400 bg-green-500/20";
  } else if (status === 'active') {
    Icon = PlayCircle;
    borderColor = "border-red-500";
    bgColor = "bg-gradient-to-br from-gray-900 to-red-950/30";
    iconColor = "text-red-400 bg-red-500/20 animate-pulse";
  } else if (status === 'failed') {
    Icon = AlertCircle;
    borderColor = "border-red-500/50";
    bgColor = "bg-gradient-to-br from-gray-900 to-red-950/20";
    iconColor = "text-red-400 bg-red-500/20";
  } else {
    Icon = Lock;
  }

  if (data.isRoot && status === 'active') {
    Icon = Sparkles;
  }

  return (
    <div className={`px-6 py-4 shadow-2xl shadow-black/50 rounded-2xl ${bgColor} border-2 ${borderColor} text-white min-w-[240px] transition-transform hover:scale-105`}>
      <Handle type="target" position={Position.Top} className={`w-4 h-4 ${status === 'locked' ? 'bg-gray-700' : 'bg-red-500'} border-2 border-gray-900`} />
      
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl border border-white/5 ${iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide">{data.label}</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">
            {status}
          </span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className={`w-4 h-4 ${status === 'locked' ? 'bg-gray-700' : 'bg-red-500'} border-2 border-gray-900`} />
    </div>
  );
}
