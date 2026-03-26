import { Handle, Position } from '@xyflow/react';
import { Sparkles, BookOpen } from 'lucide-react';

export default function CustomNode({ data }: { data: { label: string; isRoot?: boolean } }) {
  return (
    <div className="px-6 py-4 shadow-2xl shadow-blue-900/20 rounded-2xl bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-blue-500/40 text-white min-w-[220px] transition-transform hover:scale-105">
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-blue-500 border-2 border-gray-900" />
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20">
          {data.isRoot ? <Sparkles size={20} /> : <BookOpen size={20} />}
        </div>
        <div className="font-bold text-sm tracking-wide">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-blue-500 border-2 border-gray-900" />
    </div>
  );
}
