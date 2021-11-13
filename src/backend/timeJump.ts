import { Console } from 'console';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/**
 * This file contains necessary functionality for time-travel feature
 *
 * It exports an anonymous
 * @function timeJump
 * @param origin The latest snapshot, linked to the fiber (changes to origin will change app)
 * @param mode The current mode (i.e. jumping, time-traveling, or paused)
 * @returns A function that takes a target snapshot and a boolean flag checking for firstCall, then invokes `jump` on that target snapshot
 *
 * The target snapshot portrays some past state we want to travel to.
 * `jump` recursively sets state for any stateful components.
 */

/* eslint-disable no-param-reassign */

import componentActionsRecord from './masterState';

const circularComponentTable = new Set();
export default (origin, mode) => {
  // Recursively change state of tree
  // Set the state of the origin tree if the component is stateful
  function jump(target, firstCall = false) {
    // console.log('componentActionsRecord', componentActionsRecord);
    // console.log('origin', origin);
    // console.log('target', target);
    if (!target) return;
    if (target.state === 'stateless') {
      target.children.forEach(child => jump(child));
      return;
    }
    // for stateful class components
    const component = componentActionsRecord.getComponentByIndex(
      target.componentData.index,
    );

    // check if it is a stateful class component
    // if yes, find the component by its index and assign it to a variable
    // call that components setState method to reset state to the state at the time of the jump snapshot
    if (component && component.setState) {
      component.setState(
        // prevState contains the states of the snapshots we are jumping FROM, not jumping TO
        prevState => {
          Object.keys(prevState).forEach(key => {
            // if conditional below does not appear to ever be reached if all states are defined - leaving code in just in case codebases do have undefined states
            if (!target.state[key] === undefined) {
              target.state[key] = undefined;
            }
          });
          return target.state;
        },
        // Iterate through new children after state has been set
        () => target.children.forEach(child => jump(child)),
      );
    }

    target.children.forEach(child => {
      if (!circularComponentTable.has(child)) {
        circularComponentTable.add(child);
        jump(child);
      }
    });

    // Check for hooks state and set it with dispatch()
    // if (target.state && target.state.hooksState) {
    //   target.state.hooksState.forEach(hook => {
    //     const hooksComponent = componentActionsRecord.getComponentByIndex(
    //       target.componentData.hooksIndex,
    //     );
    //     // console.log('hooksComponent', hooksComponent);
    //     const hookState = Object.values(hook);
    //     if (hooksComponent && hooksComponent.dispatch) {
    //       if (Array.isArray(hookState[0]) && hookState[0].length > 0 || !Array.isArray(hookState[0])) {
    //         hooksComponent.dispatch(hookState[0]);
    //       }
    //     }
    //   });
    // }

    // attempt 2
    // if (target.state && target.state.hooksState) {
    //   console.log('target.state.hooksState', target.state.hooksState);
    //   // console.log('target.componentData.hooksIndex', target.componentData.hooksIndex);
    //   // console.log('componentActionsRecord', componentActionsRecord);
    //   const hooksComponent = componentActionsRecord.getComponentByIndex(
    //     target.componentData.hooksIndex,
    //     // 13,
    //     // whatever we pass into here is the hook that is being updated
    //   );
    //   // console.log('hooksComponent', hooksComponent);
    //   const hookState = Object.values(target.state.hooksState[0]);
    //   // console.log('hookState', hookState);
    //   if (hooksComponent && hooksComponent.dispatch) {
    //     if (Array.isArray(hookState[0]) && hookState[0].length > 0 || !Array.isArray(hookState[0])) {
    //       hooksComponent.dispatch(hookState[0]);
    //     }
    //   }
    // }

    // multiple dispatch check
    if (target.state && target.state.hooksState) {
      console.log('target', target);
      console.log('target.componentData.hooksIndex', target.componentData.hooksIndex);
      console.log('componentActionsRecord', componentActionsRecord);
      const hooksComponent = componentActionsRecord.getComponentByIndex([
        target.componentData.hooksIndex + 1,
        target.componentData.hooksIndex + 2,
        target.componentData.hooksIndex + 3,
        target.componentData.hooksIndex + 4,
        target.componentData.hooksIndex + 5,
        target.componentData.hooksIndex + 6,
      ]);
      console.log('hooksComponent', hooksComponent);
      console.log('target.state.hooksState', target.state.hooksState);
      for (let i = 0; i < target.state.hooksState.length; i += 1) {
        if (Array.isArray(Object.values(target.state.hooksState[i]))) {
          console.log('Object.values(target.state.hooksState[i])', Object.values(target.state.hooksState[i]));
          hooksComponent[i].dispatch(Object.values(target.state.hooksState[i])[0]);
        } else {
          hooksComponent[i].dispatch(Object.values(target.state.hooksState[i]));
        }
      }
    }
  }

  return (target, firstCall = false) => {
    // * Setting mode disables setState from posting messages to window
    mode.jumping = true;
    if (firstCall) circularComponentTable.clear();
    jump(target);
    setTimeout(() => {
      mode.jumping = false;
    }, 100);
  };
};
