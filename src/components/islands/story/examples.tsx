import { exampleSpots } from '../../../data/storyTown'
import { roadHeight } from '../../../data/streamletTour'
import { Pin, SignalRings } from './actors'
import type { ActorProps } from './shared'

export function ExampleSpots({ story, isStatic }: ActorProps) {
  return (
    <>
      {exampleSpots.map((spot, index) => (
        <group key={spot.id}>
          <SignalRings
            at={[spot.at[0], roadHeight, spot.at[1]]}
            story={story}
            isStatic={isStatic}
            strength={(state) => state.examples[index].signal}
          />
          <Pin
            at={spot.at}
            height={spot.pinHeight}
            story={story}
            isStatic={isStatic}
            look={(state) => {
              const example = state.examples[index]
              return {
                shown: example.alert || example.resolved,
                tone: example.resolved ? 'ok' : spot.tone,
                alarm: example.alert,
              }
            }}
          />
        </group>
      ))}
    </>
  )
}
