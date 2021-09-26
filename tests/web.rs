//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_game_of_life;
use wasm_game_of_life::{Universe, CellCoordinates};

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}

#[wasm_bindgen_test]
pub fn test_reset() {
    let mut input_universe = Universe::new_empty_with_dimensions(6,6);
    let not_expected_universe = Universe::new_empty_with_dimensions(6,6);

    input_universe.reset();
    assert_ne!(&input_universe.get_cells(), &not_expected_universe.get_cells());
}

#[wasm_bindgen_test]
pub fn test_clear() {
    let mut input_universe = Universe::new_with_dimensions(6,6);
    let expected_universe = Universe::new_empty_with_dimensions(6, 6);

    input_universe.clear();
    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}

#[wasm_bindgen_test]
pub fn test_toggle() {
    let mut input_universe = Universe::new_empty_with_dimensions(2, 2);

    let mut expected_universe = Universe::new_empty_with_dimensions(2, 2);
    expected_universe.set_cells(&[
        CellCoordinates(0,0)
    ]);

    input_universe.toggle_cell(0,0);
    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}


#[cfg(test)]
pub fn input_spaceship() -> Universe {
    let mut universe = Universe::new_empty_with_dimensions(6, 6);
    universe.set_cells(&[
        CellCoordinates(1,2),
        CellCoordinates(2,3),
        CellCoordinates(3,1),
        CellCoordinates(3,2),
        CellCoordinates(3,3)
    ]);
    universe
}

#[cfg(test)]
pub fn expected_spaceship() -> Universe {
    let mut universe = Universe::new_empty_with_dimensions(6, 6);
    universe.set_cells(&[
        CellCoordinates(2,1),
        CellCoordinates(2,3),
        CellCoordinates(3,2),
        CellCoordinates(3,3),
        CellCoordinates(4,2)
    ]);
    universe
}

#[wasm_bindgen_test]
pub fn test_tick() {
    // Let's create a smaller Universe with a small spaceship to test!
    let mut input_universe = input_spaceship();

    // This is what our spaceship should look like
    // after one tick in our universe.
    let expected_universe = expected_spaceship();

    // Call `tick` and then see if the cells in the `Universe`s are the same.
    input_universe.tick();
    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}
