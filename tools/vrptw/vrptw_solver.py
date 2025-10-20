import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


def parse_solomon_instance(file_path):
    """Parse a Solomon VRPTW instance file into a data dictionary."""
    with open(file_path, 'r') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    vehicle_info_idx = -1
    customer_start_idx = -1

    for i, line in enumerate(lines):
        if line.startswith('VEHICLE'):
            vehicle_info_idx = i + 2
        elif line.startswith('CUSTOMER'):
            customer_start_idx = i + 2
            break

    if vehicle_info_idx == -1 or customer_start_idx == -1:
        raise ValueError('VEHICLE or CUSTOMER section missing')

    parts = lines[vehicle_info_idx].split()
    num_vehicles = int(parts[0])
    vehicle_capacity = int(parts[1])

    data = {
        'locations': [],
        'demands': [],
        'time_windows': [],
        'service_times': [],
        'num_vehicles': num_vehicles,
        'vehicle_capacities': [vehicle_capacity] * num_vehicles,
        'depot': 0,
    }

    for line in lines[customer_start_idx:]:
        tokens = line.split()
        if len(tokens) < 7:
            continue
        x = int(tokens[1])
        y = int(tokens[2])
        demand = int(tokens[3])
        ready = int(tokens[4])
        due = int(tokens[5])
        service = int(tokens[6])

        data['locations'].append((x, y))
        data['demands'].append(demand)
        data['time_windows'].append((ready, due))
        data['service_times'].append(service)

    return data


def create_data_model(parsed_data):
    """Return parsed data as OR-Tools compatible model data."""
    return parsed_data


def get_solution_data(data, manager, routing, solution):
    """Return a structured representation of the solution."""
    sol = {
        'objective_value': solution.ObjectiveValue(),
        'total_distance': 0,
        'total_load': 0,
        'total_time': 0,
        'routes': []
    }
    time_dim = routing.GetDimensionOrDie('Time')

    for vehicle_id in range(data['num_vehicles']):
        index = routing.Start(vehicle_id)
        route = {
            'vehicle_id': vehicle_id,
            'path': [],
            'distance': 0,
            'load': 0,
            'time': 0
        }
        load = 0
        distance = 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            time_var = time_dim.CumulVar(index)
            route['path'].append({
                'node_id': node,
                'location': data['locations'][node],
                'arrival_time': solution.Min(time_var),
                'departure_time': solution.Max(time_var),
            })
            load += data['demands'][node]
            prev_index = index
            index = solution.Value(routing.NextVar(index))
            distance += routing.GetArcCostForVehicle(prev_index, index, vehicle_id)
        node = manager.IndexToNode(index)
        time_var = time_dim.CumulVar(index)
        route['path'].append({
            'node_id': node,
            'location': data['locations'][node],
            'arrival_time': solution.Min(time_var),
            'departure_time': solution.Max(time_var),
        })
        route['distance'] = distance
        route['time'] = solution.Min(time_dim.CumulVar(routing.End(vehicle_id)))
        route['load'] = load
        sol['routes'].append(route)
        sol['total_distance'] += distance
        sol['total_time'] += route['time']
        sol['total_load'] += load
    return sol


def solve_vrptw(file_path):
    """Solve the VRPTW for a given instance file and return solution data."""
    data = create_data_model(parse_solomon_instance(file_path))
    manager = pywrapcp.RoutingIndexManager(len(data['locations']), data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        f = manager.IndexToNode(from_index)
        t = manager.IndexToNode(to_index)
        return int(math.hypot(data['locations'][f][0] - data['locations'][t][0],
                               data['locations'][f][1] - data['locations'][t][1]))

    transit_cb = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

    def demand_callback(from_index):
        node = manager.IndexToNode(from_index)
        return data['demands'][node]

    demand_cb = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_cb, 0, data['vehicle_capacities'], True, 'Capacity')

    def time_callback(from_index, to_index):
        f = manager.IndexToNode(from_index)
        t = manager.IndexToNode(to_index)
        travel_time = int(math.hypot(data['locations'][f][0] - data['locations'][t][0],
                                     data['locations'][f][1] - data['locations'][t][1]))
        return travel_time + data['service_times'][f]

    time_cb = routing.RegisterTransitCallback(time_callback)
    horizon = max(tw[1] for tw in data['time_windows']) + sum(data['service_times']) + 1000
    routing.AddDimension(time_cb, horizon, horizon, False, 'Time')
    time_dim = routing.GetDimensionOrDie('Time')

    for idx, (start, end) in enumerate(data['time_windows']):
        index = manager.NodeToIndex(idx)
        time_dim.CumulVar(index).SetRange(start, end)

    for vehicle_id in range(data['num_vehicles']):
        routing.AddVariableMinimizedByFinalizer(time_dim.CumulVar(routing.Start(vehicle_id)))
        routing.AddVariableMinimizedByFinalizer(time_dim.CumulVar(routing.End(vehicle_id)))

    for node in range(1, len(data['locations'])):
        routing.AddDisjunction([manager.NodeToIndex(node)], 1000000)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.FromSeconds(30)

    solution = routing.SolveWithParameters(params)
    if not solution:
        return None
    return get_solution_data(data, manager, routing, solution)

if __name__ == '__main__':
    import json
    import pathlib

    instance_dir = pathlib.Path(__file__).parent / 'instances'
    for name in ['c101.txt', 'r101.txt', 'rc101.txt']:
        path = instance_dir / name
        sol = solve_vrptw(str(path))
        if sol:
            with open(path.with_suffix('.json'), 'w') as f:
                json.dump(sol, f, indent=2)
            print(f'Solution for {name} saved to {path.with_suffix(".json")}')
        else:
            print(f'No solution for {name}')
