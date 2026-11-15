import LottiePlayer from '../LottiePlayer'
import treeLightGreenAnimation from '../../../json/treeLightGreenAnimation.json'
import treeMiddleGreenAnimation from '../../../json/treeMiddleGreenAnimation.json'
import treeDarkGreenAnimation from '../../../json/treeDarkGreenAnimation.json'
import { useReducedMotion } from '../../../hooks/useReducedMotion'

// Placed and sized by .hero-grove in hero.css, as one group standing on the hill.
function HomepageHeroTrees() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="hero-grove">
      <div className="hero-cloud">
        <svg
          className="animate-move"
          viewBox="0 0 855 178"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5F5F5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E8E8E8" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M0.000244141 177.46L811.67 169.552C811.67 169.552 875.2 171.712 848 61.3116C820.8 -49.0884 666.334 13.5888 609.5 72.2555C488.7 -70.5445 378.167 47.0888 338 123.755C242.5 98.96 202.167 144.46 195 163.46C195 163.46 174.5 157.46 163 157.46C138.132 155.845 129.5 162.46 125 166.46C125 166.46 112.465 169.553 96.0002 167.96C84.0002 166.799 70.1939 166.472 52.5002 167.96C25.0002 171.96 0.000244141 174.625 0.000244141 177.46Z"
            fill="url(#cloudGradient)"
          />
        </svg>
      </div>

      <LottiePlayer
        className="hero-tree hero-tree-dark"
        animationData={treeDarkGreenAnimation}
        autoplay={!reducedMotion}
      />
      <LottiePlayer
        className="hero-tree hero-tree-light"
        animationData={treeLightGreenAnimation}
        autoplay={!reducedMotion}
      />
      <LottiePlayer
        className="hero-tree hero-tree-middle"
        animationData={treeMiddleGreenAnimation}
        autoplay={!reducedMotion}
      />
    </div>
  )
}

export default HomepageHeroTrees
