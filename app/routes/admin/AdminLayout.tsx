import { redirect, Outlet, useLoaderData } from 'react-router';
import { sharedLoader } from '~/utils/sharedLoader';
import AdminNavigation from '~/components/Molecules/AdminNavigation/AdminNavigation';

export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request);

  if (user.role !== 'admin') {
    throw redirect(`/admin/${user.id}`);
  }

  return { user };
};

const AdminLayout = () => {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 md:gap-10 items-start relative z-10">
      {user.role === 'admin' && <AdminNavigation />}
      <div className="flex-1 p-4 w-full">
        <Outlet context={{ user }} />
      </div>
      {!user && (
        <div className="bg-noir-light/40 backdrop-blur-sm rounded-md shadow-md p-6 border border-noir-dark">
          <h1 className="text-2xl font-bold mb-4">Welcome, Guest!</h1>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
