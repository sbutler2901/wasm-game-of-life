mod utils;

extern crate js_sys;
extern crate web_sys;

//use utils::Timer;
use wasm_bindgen::prelude::*;
use std::fmt;
use std::ops::{Index, IndexMut};

/* Static values */

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static U_WIDTH: u16 = 128;
static U_HEIGHT: u16 = 128;

static TOP_ROWS: PulsarRowSet = PulsarRowSet {
    row1: [6],
    row2: [4,3,2],
    row3: [1]
};
static BOTTOM_ROWS: PulsarRowSet = PulsarRowSet {
    row1: [1],
    row2: [2,3,4],
    row3: [6]
};
static LEFT_COLS: PulsarColSet = PulsarColSet {
    col1: [4,3,2],
    col2: [6,1],
    col3: [4,3,2]
};
static RIGHT_COLS: PulsarColSet = PulsarColSet {
    col1: [2,3,4],
    col2: [1,6],
    col3: [2,3,4]
};

/* Game of Life */

struct PulsarRowSet {
    row1: [i16; 1],
    row2: [i16; 3],
    row3: [i16; 1]
}

struct PulsarColSet {
    col1: [i16; 3],
    col2: [i16; 2],
    col3: [i16; 3]
}

#[wasm_bindgen]
#[repr(u8)] // each cell represented as a byte
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    // Toggles a cell's state between alive and dead
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }

    fn new_rand_cell() -> Cell {
        let num = js_sys::Math::random();
        if num < 0.5 {
            Cell::Alive
        } else {
            Cell::Dead
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CellCoordinates(pub u16, pub u16);

#[repr(usize)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum ActiveArray {
    First,
    Second
}

impl Index<ActiveArray> for [Vec<Cell>] {
    type Output = Vec<Cell>;

    fn index(&self, active_ary: ActiveArray) -> &Self::Output {
        match active_ary {
            ActiveArray::First => &self[0],
            ActiveArray::Second => &self[1]
        }
    }
}

impl IndexMut<ActiveArray> for [Vec<Cell>] {
    fn index_mut(&mut self, active_ary: ActiveArray) -> &mut Self::Output {
        match active_ary {
            ActiveArray::First => &mut self[0],
            ActiveArray::Second => &mut self[1]
        }
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u16,
    height: u16,
    cells: [Vec<Cell>; 2],
    active: ActiveArray,
    changed_cells: Vec<CellCoordinates>,
}

impl Universe {
    /// represent matrix as array
    fn get_index(&self, row: u16, column: u16) -> usize {
        (row * self.width + column) as usize
    }

    /// Gets number of live neighbors surrounding a cell
    fn live_neighbor_count(&self, row: u16, column: u16) -> u8 {
        let mut count = 0;

        let north = if row == 0 {
            self.height - 1
        } else {
            row - 1
        };

        let south = if row == self.height - 1 {
            0
        } else {
            row + 1
        };

        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };

        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        let nw = self.get_index(north, west);
        count += self.cells[self.active][nw] as u8;

        let n = self.get_index(north, column);
        count += self.cells[self.active][n] as u8;

        let ne = self.get_index(north, east);
        count += self.cells[self.active][ne] as u8;

        let w = self.get_index(row, west);
        count += self.cells[self.active][w] as u8;

        let e = self.get_index(row, east);
        count += self.cells[self.active][e] as u8;

        let sw = self.get_index(south, west);
        count += self.cells[self.active][sw] as u8;

        let s = self.get_index(south, column);
        count += self.cells[self.active][s] as u8;

        let se = self.get_index(south, east);
        count += self.cells[self.active][se] as u8;

        count
    }

    /// Get the dead and alive values of the entire universe.
    /// Returns a borrowed reference: not allowed for rust -> wasm functions
    pub fn get_cells(&self) -> &[Cell] {
        &self.cells[self.active]
    }

    /// Set cells to be alive in a universe by passing the row and column
    /// of each cell as an array.
    pub fn set_cells(&mut self, cells: &[CellCoordinates]) {
        self.changed_cells.clear();
        for coordinates in cells.iter().cloned() {
            let idx = self.get_index(coordinates.0, coordinates.1);
            self.cells[self.active][idx] = Cell::Alive;
            self.changed_cells.push(coordinates);
        }
    }

    /// Clears a square around a cell in all directions by specified size
    /// Dimensions = (size * 2 + 1) x (size * 2 + 1)
    fn clear_square(&mut self, row: u16, column: u16, size: i16) {
        let int_row = row as i16;
        let int_col = column as i16;
        let int_height = self.height as i16;
        let int_width = self.width as i16;

        for row_cnt in 0..=size {
            let prev_row = (int_row - row_cnt).rem_euclid(int_height) as u16;
            let post_row = (int_row + row_cnt).rem_euclid(int_height) as u16;

            for col_cnt in 0..=size {
                let prev_col = (int_col - col_cnt).rem_euclid(int_width) as u16;
                let post_col = (int_col + col_cnt).rem_euclid(int_width) as u16;
                let mut idx;

                if row_cnt == 0 && col_cnt == 0 {
                    idx = self.get_index(row, column);
                    self.cells[self.active][idx] = Cell::Dead;
                } else {
                    idx = self.get_index(prev_row, prev_col);
                    self.cells[self.active][idx] = Cell::Dead;
                    idx = self.get_index(prev_row, post_col);
                    self.cells[self.active][idx] = Cell::Dead;
                    idx = self.get_index(post_row, prev_col);
                    self.cells[self.active][idx] = Cell::Dead;
                    idx = self.get_index(post_row, post_col);
                    self.cells[self.active][idx] = Cell::Dead;
                }
            }
        }
    }

    /** Initializes a new universe of the specified size with all cells set to dead */
    pub fn new_empty_with_dimensions(width: u16, height: u16) -> Universe {
        utils::set_panic_hook();    // enable rust panics in developer console

        let num_cells = (width * height) as usize;

        let active_cells = vec![Cell::Dead; num_cells];
        let secondary_cells = vec![Cell::Dead; num_cells];
        let changed_cells = Vec::with_capacity(num_cells);

        Universe {
            width,
            height,
            cells: [active_cells, secondary_cells],
            active: ActiveArray::First,
            changed_cells
        }
    }

    /** Initializes a new universe of the specified size */
    pub fn new_with_dimensions(width: u16, height: u16) -> Universe {
        utils::set_panic_hook();    // enable rust panics in developer console

        let num_cells = (width * height) as usize;

        let active_cells = (0..num_cells)
            .map(|_| {
                Cell::new_rand_cell()
            })
            .collect();

        let secondary_cells = vec![Cell::Dead; num_cells];
        let changed_cells = Vec::with_capacity(num_cells);

        Universe {
            width,
            height,
            cells: [active_cells, secondary_cells],
            active: ActiveArray::First,
            changed_cells
        }
    }
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    /// Get width of the universe
    pub fn width(&self) -> u16 {
        self.width
    }

    /// Get height of the universe
    pub fn height(&self) -> u16 {
        self.height
    }

    /// Provides a pointer to the cells vector
    pub fn cells(&self) -> *const Cell {
        self.cells[self.active].as_ptr()
    }

    /// Gets all changed cells
    pub fn changed_cells(&self) -> *const CellCoordinates {
        self.changed_cells.as_ptr()
    }

    /// Gets length of the cells that have changed
    pub fn changed_cells_length(&self) -> u32 {
        self.changed_cells.len() as u32
    }

    pub fn changed_cells_clear(&mut self) {
        self.changed_cells.clear();
    }

    /// Provides a JS method for toggling a cell
    pub fn toggle_cell(&mut self, row: u16, column: u16) {
        let idx = self.get_index(row, column);
        self.cells[self.active][idx].toggle();
        self.changed_cells.push(CellCoordinates(row, column))
    }

    /// Creates a new Universe
    pub fn new() -> Universe {
        let width = U_WIDTH;
        let height = U_HEIGHT;

        Universe::new_with_dimensions(width, height)
    }

    /// Resets the universe to a random initial state
    pub fn reset(&mut self) {
        self.changed_cells.clear();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                self.cells[self.active][idx] = Cell::new_rand_cell();
                self.changed_cells.push(CellCoordinates(row,col));
            }
        }
    }

    /// Sets all cells in the universe to dead
    pub fn clear(&mut self) {
        self.changed_cells.clear();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                self.cells[self.active][idx] = Cell::Dead;
                self.changed_cells.push(CellCoordinates(row,col));
            }
        }
    }

    /// Renders a textual representation of the universe in its current state
    pub fn render(&self) -> String {
        self.to_string()
    }

    /// Causes a state change for the universe according to the Game's rules
    pub fn tick(&mut self) {
//        let _timer = Timer::new("Universe::tick");

        let old_inactive = if self.active == ActiveArray::First {
            ActiveArray::Second
        } else {
            ActiveArray::First
        };

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[self.active][idx];
                let num_live_neighbors = self.live_neighbor_count(row, col);

                let cell_next_state = match (cell, num_live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                if cell != cell_next_state {
//                    log!("Changed cell coordinates: {} x {}", row, col);
                    self.changed_cells.push(CellCoordinates(row, col));
                }

                self.cells[old_inactive][idx] = cell_next_state;
            }
        }

//        log!("Changed lib: {:?}", self.changed_cells);
        self.active = old_inactive;
    }

    /// Inserts a glider around cell specified
    pub fn insert_glider(&mut self, row: u16, column: u16) {
//        let _timer = Timer::new("Universe::insert_glider");

        let row_above = (row - 1).rem_euclid(self.height);
        let row_below = (row + 1).rem_euclid(self.height);
        let column_before =  (column - 1).rem_euclid(self.width);
        let column_after =  (column + 1).rem_euclid(self.width);

        // clear surrounding cells
        self.clear_square(row, column, 1);
        // set glider cells
        self.set_cells(&[
            CellCoordinates(row_above, column),
            CellCoordinates(row, column_after),
            CellCoordinates(row_below, column_before),
            CellCoordinates(row_below, column),
            CellCoordinates(row_below, column_after)
        ]);
    }

    /// Inserts a pulsar around cell specified
    pub fn insert_pulsar(&mut self, row: u16, column: u16) {
//        let _timer = Timer::new("Universe::insert_pulsar");

        let int_row = row as i16;
        let int_col = column as i16;
        let int_height = self.height as i16;
        let int_width = self.width as i16;

        let mut tmp_row;
        let mut tmp_col;
        let mut cells: Vec<CellCoordinates> = vec![];


        self.clear_square(row, column, 7);

        /* top rows */
        // set 1
        tmp_row = (int_row - TOP_ROWS.row1[0]).rem_euclid(int_height) as u16;
        //// left cols
        for l_col in LEFT_COLS.col1.iter() {
            tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }
        //// right cols
        for r_col in RIGHT_COLS.col1.iter() {
            tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));

        }

        // set 2
        for t_row in TOP_ROWS.row2.iter() {
            tmp_row = (int_row - *t_row).rem_euclid(int_height) as u16;
            //// left cols
            for l_col in LEFT_COLS.col2.iter() {
                tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
                cells.push(CellCoordinates(tmp_row, tmp_col));
            }
            //// right cols
            for r_col in RIGHT_COLS.col2.iter() {
                tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
                cells.push(CellCoordinates(tmp_row, tmp_col));
            }
        }

        // set 3
        tmp_row = (int_row - TOP_ROWS.row3[0]).rem_euclid(int_height) as u16;
        //// left cols
        for l_col in LEFT_COLS.col3.iter() {
            tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }
        //// right cols
        for r_col in RIGHT_COLS.col3.iter() {
            tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }

        /* bottom rows */

        // set 1
        tmp_row = (int_row + BOTTOM_ROWS.row1[0]).rem_euclid(int_height) as u16;
        //// left cols
        for l_col in LEFT_COLS.col1.iter() {
            tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }
        //// right cols
        for r_col in RIGHT_COLS.col1.iter() {
            tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));

        }

        // set 2
        for t_row in BOTTOM_ROWS.row2.iter() {
            tmp_row = (int_row + *t_row).rem_euclid(int_height) as u16;
            //// left cols
            for l_col in LEFT_COLS.col2.iter() {
                tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
                cells.push(CellCoordinates(tmp_row, tmp_col));
            }
            //// right cols
            for r_col in RIGHT_COLS.col2.iter() {
                tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
                cells.push(CellCoordinates(tmp_row, tmp_col));
            }
        }

        // set 3
        tmp_row = (int_row + BOTTOM_ROWS.row3[0]).rem_euclid(int_height) as u16;
        //// left cols
        for l_col in LEFT_COLS.col3.iter() {
            tmp_col = (int_col - *l_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }
        //// right cols
        for r_col in RIGHT_COLS.col3.iter() {
            tmp_col = (int_col + *r_col).rem_euclid(int_width) as u16;
            cells.push(CellCoordinates(tmp_row, tmp_col));
        }

        self.set_cells(&cells);
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells[self.active].as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == Cell::Dead { '◻' } else { '◼' };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}
