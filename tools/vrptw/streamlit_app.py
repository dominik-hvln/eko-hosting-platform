import json
import pathlib

import plotly.graph_objects as go
import streamlit as st

from vrptw_solver import solve_vrptw

INSTANCE_DIR = pathlib.Path(__file__).parent / 'instances'


def plot_solution(solution: dict):
    """Return a Plotly figure visualizing vehicle routes."""
    fig = go.Figure()
    colors = [f'hsl({i*50 % 360},70%,50%)' for i in range(len(solution['routes']))]

    # Draw nodes
    for route, color in zip(solution['routes'], colors):
        xs = [p['location'][0] for p in route['path']]
        ys = [p['location'][1] for p in route['path']]
        fig.add_trace(
            go.Scatter(
                x=xs,
                y=ys,
                mode="lines+markers",
                name=f"Vehicle {route['vehicle_id']}",
                line=dict(color=color),
            )
        )
    fig.update_layout(title='VRPTW Solution', xaxis_title='X', yaxis_title='Y')
    return fig


def main():
    st.title('VRPTW Solver')

    st.sidebar.header('Instance Selection')
    instance_names = [p.name for p in INSTANCE_DIR.glob('*.txt')]
    instance = st.sidebar.selectbox('Choose instance', instance_names)

    run = st.sidebar.button('Solve')

    if run:
        with st.spinner('Solving...'):
            sol = solve_vrptw(str(INSTANCE_DIR / instance))
        if not sol:
            st.error('No solution found')
            return
        st.success('Solution found')
        st.json(sol)
        fig = plot_solution(sol)
        st.plotly_chart(fig, use_container_width=True)


if __name__ == '__main__':
    main()
