export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
      },
      {
        path: 'product',
        component: () => import('@/pages/product/index.vue'),
      },
      {
        path: 'product/create',
        component: () => import('@/pages/product/create.vue'),
      },
      {
        path: 'product/view/:id',
        component: () => import('@/pages/product/view/[id].vue'),
      },
      {
        path: 'product/edit/:id',
        component: () => import('@/pages/product/edit/[id].vue'),
      },
      {
        path: 'categories',
        component: () => import('@/pages/categories/index.vue'),
      },
      {
        path: 'categories/create',
        component: () => import('@/pages/categories/create.vue'),
      },
      {
        path: 'categories/view/:id',
        component: () => import('@/pages/categories/view/[id].vue'),
      },
      {
        path: 'categories/edit/:id',
        component: () => import('@/pages/categories/edit/[id].vue'),
      },
      {
        path: 'orders',
        component: () => import('@/pages/orders/index.vue'),
      },
      {
        path: 'orders/create',
        component: () => import('@/pages/orders/create.vue'),
      },
      {
        path: 'orders/view/:id',
        component: () => import('@/pages/orders/view/[id].vue'),
      },
      {
        path: 'orders/edit/:id',
        component: () => import('@/pages/orders/edit/[id].vue'),
      },
      {
        path: 'table',
        component: () => import('@/pages/table/index.vue'),
      },
      {
        path: 'table/create',
        component: () => import('@/pages/table/create.vue'),
      },
      {
        path: 'table/view/:id',
        component: () => import('@/pages/table/view/[id].vue'),
      },
      {
        path: 'table/edit/:id',
        component: () => import('@/pages/table/edit/[id].vue'),
      },
      {
        path: 'account-settings',
        component: () => import('@/pages/account-settings.vue'),
      },
      {
        path: 'typography',
        component: () => import('@/pages/typography.vue'),
      },
      {
        path: 'icons',
        component: () => import('@/pages/icons.vue'),
      },
      {
        path: 'cards',
        component: () => import('@/pages/cards.vue'),
      },
      {
        path: 'tables',
        component: () => import('@/pages/tables.vue'),
      },
      {
        path: 'form-layouts',
        component: () => import('@/pages/form-layouts.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'login',
        component: () => import('@/pages/login.vue'),
      },
      {
        path: 'register',
        component: () => import('@/pages/register.vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]
