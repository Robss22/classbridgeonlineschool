import Link from 'next/link';

export default function NavigationBar({ navItems, activeHref }) {
  return (
    <nav className="flex justify-between gap-2 mb-6 sm:mb-8 items-center bg-blue-100 rounded-xl px-1 sm:px-4 py-2 shadow border border-blue-200 max-w-full overflow-x-auto whitespace-nowrap">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-blue-800 text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border border-blue-900 shadow-sm hover:bg-blue-700 focus:bg-blue-700 transition whitespace-nowrap min-w-[70px] sm:min-w-[90px] md:min-w-[110px] h-10 overflow-hidden text-ellipsis text-center ${activeHref === item.href ? 'ring-2 ring-blue-400' : ''}`}
        >
          <span className="hidden sm:inline text-base md:text-lg">{item.icon}</span> <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 