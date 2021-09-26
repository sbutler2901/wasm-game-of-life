#![feature(test)]

/* Usage
- Must comment out all #[wasm_bindgen] annotations, and the "cdylib" bits from Cargo.toml
- cargo bench | tee before.txt
*/


extern crate test;
extern crate wasm_game_of_life;

#[bench]
fn universe_ticks(b: &mut test::Bencher) {
    let mut universe = wasm_game_of_life::Universe::new();

    b.iter(|| {
        universe.tick();
    });
}

