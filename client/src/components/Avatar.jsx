export default function Avatar({ src, username, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-xs',
    lg: 'w-20 h-20 text-3xl',
  };
  const cls = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <span className={`${cls} rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-semibold flex-shrink-0`}>
      {username?.charAt(0).toUpperCase()}
    </span>
  );
}
