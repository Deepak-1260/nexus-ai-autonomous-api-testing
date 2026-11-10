
import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
}

function Header({ title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-800 bg-[#0b1120]/95 px-5 backdrop-blur-xl md:px-8">

      {/* Page Information */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>
        <p className="hidden text-sm text-slate-400 sm:block">
          {description}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <button
          className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-slate-500 sm:flex"
        >
          <Search size={16} />
          Search
        </button>

        <button className="relative rounded-lg border border-slate-700 p-2.5 text-slate-400 hover:text-white">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          DK
        </div>
      </div>
    </header>
  );
}

export default Header;
