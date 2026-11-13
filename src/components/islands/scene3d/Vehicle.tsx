import type { RefObject } from 'react'
import type { Group } from 'three'
import { tourColors } from '../../../data/streamletTour'

export const WHEEL_RADIUS = 0.55

const wheelPositions: readonly (readonly [number, number])[] = [
  [1.55, 3.4],
  [-1.55, 3.4],
  [1.55, -1],
  [-1.55, -1],
  [1.55, -3],
  [-1.55, -3],
]

// The truck is modelled facing its own +z. The wheels are grouped so the
// animation can spin each about its axle.
export function Vehicle({ wheels }: { wheels: RefObject<Group[]> }) {
  return (
    <>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[3.2, 0.7, 10.4]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>

      <mesh position={[0, 1.35, -0.9]}>
        <boxGeometry args={[3.4, 0.4, 7.2]} />
        <meshLambertMaterial color={tourColors.vehicleBody} />
      </mesh>

      {wheelPositions.map(([x, z], index) => (
        <group
          key={`${x}-${z}`}
          position={[x, WHEEL_RADIUS, z]}
          ref={(node) => {
            if (node) wheels.current[index] = node
          }}
        >
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.5, 16]} />
            <meshLambertMaterial color={tourColors.vehicleWheel} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.52, 12]} />
            <meshLambertMaterial color={tourColors.vehicleHub} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 2.75, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 6.4, 24]} />
        <meshLambertMaterial color={tourColors.vehicleTank} />
      </mesh>

      {[-3.5, -1.2, 1.1].map((z) => (
        <mesh key={z} position={[0, 2.75, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.62, 1.62, 0.28, 24]} />
          <meshLambertMaterial color={tourColors.vehicleBody} />
        </mesh>
      ))}

      <mesh position={[0, 2.75, -4.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.55, 0.3, 24]} />
        <meshLambertMaterial color={tourColors.vehicleTankBand} />
      </mesh>

      <mesh position={[0, 4.4, -1.2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.35, 12]} />
        <meshLambertMaterial color={tourColors.vehicleBody} />
      </mesh>

      <mesh position={[1.35, 1.75, -1.2]}>
        <boxGeometry args={[0.35, 0.5, 5.6]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>

      <mesh position={[0, 2.5, 3.6]}>
        <boxGeometry args={[3.2, 2.5, 2.8]} />
        <meshLambertMaterial color={tourColors.vehicleBody} />
      </mesh>

      <mesh position={[0, 3.85, 3.5]}>
        <boxGeometry args={[3.3, 0.25, 3]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>

      <mesh position={[0, 2.95, 5.02]}>
        <boxGeometry args={[2.7, 1.2, 0.12]} />
        <meshLambertMaterial color={tourColors.vehicleGlass} />
      </mesh>

      {[1.62, -1.62].map((x) => (
        <mesh key={x} position={[x, 2.95, 3.9]}>
          <boxGeometry args={[0.12, 1.1, 1.6]} />
          <meshLambertMaterial color={tourColors.vehicleGlass} />
        </mesh>
      ))}

      {[1.85, -1.85].map((x) => (
        <mesh key={x} position={[x, 3.1, 4.7]}>
          <boxGeometry args={[0.18, 0.55, 0.3]} />
          <meshLambertMaterial color={tourColors.vehicleTrim} />
        </mesh>
      ))}

      <mesh position={[0, 1.15, 5.15]}>
        <boxGeometry args={[3.4, 0.45, 0.3]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>

      {[1.15, -1.15].map((x) => (
        <mesh key={x} position={[x, 1.65, 5.08]}>
          <boxGeometry args={[0.6, 0.35, 0.12]} />
          <meshBasicMaterial color={tourColors.vehicleLamp} />
        </mesh>
      ))}

      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2, 5.6, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={tourColors.shadow}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
