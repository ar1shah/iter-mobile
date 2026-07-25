// saved paths API calls. backend stores waypoints as [lng, lat] pairs
// (same as the web app), so we convert to/from our LatLng shape here

import { apiRequest } from './client';
import { totalDistanceMiles, type LatLng } from '../utils/geo';

export interface SavedPath {
  id: string;
  ownerId: string;
  name: string;
  points: LatLng[];
  distanceMiles: number;
  createdAt: string;
}

interface RouteResponse {
  _id: string;
  user: string;
  routeName: string;
  distanceMiles: number;
  waypoints: [number, number][]; // [lng, lat]
  createdAt: string;
}

function fromRoute(route: RouteResponse): SavedPath {
  return {
    id: route._id,
    ownerId: route.user,
    name: route.routeName,
    points: route.waypoints.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
    distanceMiles: route.distanceMiles,
    createdAt: route.createdAt,
  };
}

export const pathsApi = {
  async getSavedPaths(): Promise<SavedPath[]> {
    const routes = await apiRequest<RouteResponse[]>('/api/routes/my-routes', { auth: true });
    return routes.map(fromRoute);
  },

  async savePath(name: string, points: LatLng[]): Promise<SavedPath> {
    const result = await apiRequest<{ message: string; route: RouteResponse }>('/api/routes/save', {
      method: 'POST',
      auth: true,
      body: {
        routeName: name.trim() || 'Untitled Path',
        distanceMiles: totalDistanceMiles(points),
        waypoints: points.map((p) => [p.longitude, p.latitude]),
      },
    });
    return fromRoute(result.route);
  },

  async deletePath(id: string): Promise<void> {
    await apiRequest<{ message: string }>(`/api/routes/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
