# VRPTW Solver Interface

This directory contains a simple Python implementation of a Vehicle Routing Problem with Time Windows (VRPTW) solver and a small interactive interface.

## Requirements

- Python 3.8+
- `ortools`
- `streamlit`
- `plotly`

Install the requirements with:

```bash
pip install -r requirements.txt
```

The `requirements.txt` file lists the minimal dependencies.

## Usage

### Running from the command line

To solve all sample instances and generate solution JSON files:

```bash
python vrptw_solver.py
```

### Running the Streamlit interface

Launch the interactive app with:

```bash
streamlit run streamlit_app.py
```

A browser window will open where you can select one of the provided Solomon instances and visualize the resulting routes.

## Instances

The `instances` folder contains three simplified Solomon-format instances (`c101.txt`, `r101.txt`, `rc101.txt`) used in examples. Each run produces a corresponding JSON file in the same folder.
