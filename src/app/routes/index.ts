import express from 'express';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { PostRoutes } from '../modules/blogpost/post.route';
import { PackageRoutes } from '../modules/package/package.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { SubscriptionRoutes as MysubscriptionRoutes } from '../modules/mysubscription/subscription.route';
const router = express.Router();

const apiRoutes = [
    { path: "/user", route: UserRoutes },
    { path: "/auth", route: AuthRoutes },
    { path: "/post", route: PostRoutes },
    { path: "/package", route: PackageRoutes },
    { path: "/subscription", route: SubscriptionRoutes },
    { path: "/mysubscription", route: MysubscriptionRoutes },
]

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;