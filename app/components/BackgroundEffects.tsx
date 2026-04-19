// 这个组件只负责“氛围层”。
// 把背景视觉效果抽离出来，后续页面逻辑再复杂，也不会影响装饰代码的可读性。
export function BackgroundEffects() {
    return (
      <>
        {/* 第一层是点阵网格，提供一种工程化、控制台式的背景质感。 */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(156,146,172,0.15) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>
  
        {/* 第二层是三个模糊光斑。
            通过位置、颜色和延迟动画制造轻微流动感，
            让原本静态的教学页面更接近真实产品首页。 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-blue-600 opacity-10 blur-xl mix-blend-multiply animate-pulse" />
          <div
            className="absolute top-40 right-20 h-72 w-72 rounded-full bg-cyan-500 opacity-10 blur-xl mix-blend-multiply animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute bottom-20 left-1/2 h-72 w-72 rounded-full bg-indigo-500 opacity-10 blur-xl mix-blend-multiply animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>
      </>
    );
  }
  