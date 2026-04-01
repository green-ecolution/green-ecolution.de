import { useState } from 'react'
import Lottie from 'lottie-react'
import treeLightGreenAnimation from '../../../json/treeLightGreenAnimation.json'
import treeMiddleGreenAnimation from '../../../json/treeMiddleGreenAnimation.json'
import treeDarkGreenAnimation from '../../../json/treeDarkGreenAnimation.json'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import AdoptTreeModal from './AdoptTreeModal'
import { generateAdoptionData } from './adoptTreeData'
import type { AdoptionData } from './adoptTreeData'

function HomepageHeroTrees() {
  const reducedMotion = useReducedMotion()
  const [adoption, setAdoption] = useState<AdoptionData | null>(null)

  return (
    <div>
      <figure
        aria-hidden="true"
        className="animate-move absolute bottom-96 md:bottom-1/2 right-2 -z-40 lg:right-1/3"
      >
        <svg
          className="w-[85%]"
          width="855"
          height="178"
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
      </figure>

      {/* Visual tree layers at original negative z-indices */}
      <figure
        aria-hidden="true"
        className="absolute bottom-10 right-[5%] -z-20 xs:bottom-16 md:right-96 lg:right-[28rem] xl:bottom-32 2xl:right-[40rem] 3xl:right-[40%] md:landscape:bottom-0 lg:landscape:bottom-16"
      >
        <Lottie
          aria-hidden="true"
          className="h-[40vh] max-h-[20rem] md:max-h-none md:min-h-96 md:h-[60vh]"
          animationData={treeLightGreenAnimation}
          autoplay={!reducedMotion}
        />
      </figure>

      <figure
        aria-hidden="true"
        className="hidden absolute right-64 -z-10 bottom-28 lg:block xl:bottom-48 2xl:right-[30rem] 2xl:bottom-28 3xl:right-[30%] landscape:hidden lg:landscape:block"
      >
        <Lottie
          aria-hidden="true"
          className="h-[40vh] md:min-h-96"
          animationData={treeMiddleGreenAnimation}
          autoplay={!reducedMotion}
        />
      </figure>

      <figure
        aria-hidden="true"
        className="hidden absolute -right-20 -z-30 bottom-16 md:block lg:bottom-32 xl:bottom-48 2xl:right-52 2xl:bottom-32 3xl:right-[12%] landscape:bottom-4 lg:landscape:bottom-32"
      >
        <Lottie
          aria-hidden="true"
          className="h-[55vh] md:h-[60vh] md:min-h-96"
          animationData={treeDarkGreenAnimation}
          autoplay={!reducedMotion}
        />
      </figure>

      {/* Invisible click targets above content */}
      <button
        type="button"
        aria-label="Baum adoptieren"
        className="absolute bottom-10 right-[5%] z-[5] xs:bottom-16 md:right-96 lg:right-[28rem] xl:bottom-32 2xl:right-[40rem] 3xl:right-[40%] md:landscape:bottom-0 lg:landscape:bottom-16 h-[65vh] max-h-[30rem] md:max-h-none md:min-h-96 md:h-[60vh] w-40 cursor-pointer"
        onClick={() => setAdoption(generateAdoptionData('light'))}
      />

      <button
        type="button"
        aria-label="Baum adoptieren"
        className="hidden absolute right-64 z-[5] bottom-28 lg:block xl:bottom-48 2xl:right-[30rem] 2xl:bottom-28 3xl:right-[30%] landscape:hidden lg:landscape:block h-[40vh] md:min-h-96 w-32 cursor-pointer"
        onClick={() => setAdoption(generateAdoptionData('middle'))}
      />

      <button
        type="button"
        aria-label="Baum adoptieren"
        className="hidden absolute -right-20 z-[5] bottom-16 md:block lg:bottom-32 xl:bottom-48 2xl:right-52 2xl:bottom-32 3xl:right-[12%] landscape:bottom-4 lg:landscape:bottom-32 h-[55vh] md:h-[60vh] md:min-h-96 w-40 cursor-pointer"
        onClick={() => setAdoption(generateAdoptionData('dark'))}
      />

      <AdoptTreeModal data={adoption} onClose={() => setAdoption(null)} />
    </div>
  )
}

export default HomepageHeroTrees
