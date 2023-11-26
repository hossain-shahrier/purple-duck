import { User } from '../payload-types';
import { BeforeChangeHook } from 'payload/dist/collections/config/types';
import { Access, CollectionConfig } from 'payload/types';

const addUser: BeforeChangeHook = ({ req, data }) => {
  const user = req.user as User | null;
  return { ...data, user: user?.id };
};

const yourOwnAndPurchased: Access = async ({ req }) => {
  const user = req.user as User | null;

  if (user?.role === 'admin') return true;
  if (!user) return false;

  const { docs: products } = await req.payload.find({
    collection: 'products',
    depth: 0,
    where: {
      user: {
        equals: user.id,
      },
    },
  });

  const ownProductFileIds = products.map((prod) => prod.product_files).flat();

  const { docs: orders } = await req.payload.find({
    collection: 'orders',
    depth: 2,
    where: {
      user: {
        equals: user.id,
      },
    },
  });

  const purchasedProductFileIds = orders
    .map((order) => {
      return order.products.map((product) => {
        if (typeof product === 'string')
          return req.payload.logger.error(
            'Search depth not sufficient to find purchased file IDs'
          );

        return typeof product.product_files === 'string'
          ? product.product_files
          : product.product_files.id;
      });
    })
    .filter(Boolean)
    .flat();

  return {
    id: {
      in: [...ownProductFileIds, ...purchasedProductFileIds],
    },
  };
};

export const ProductFiles: CollectionConfig = {
  slug: 'product_files',
  admin: {
    hidden: ({ user }) => user.role !== 'admin',
  },
  hooks: {
    beforeChange: [addUser],
  },
  access: {
    read: yourOwnAndPurchased,
    update: ({ req }) => req.user.role === 'admin',
    delete: ({ req }) => req.user.role === 'admin',
  },
  upload: {
    staticURL: '/product_files',
    staticDir: 'product_files',

    mimeTypes: [
      // # Images
      'image/*',

      // # Fonts
      'font/*',

      // # Documents
      'application/postscript',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',

      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',

      // # Presentations

      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'application/vnd.openxmlformats-officedocument.presentationml.slide',
      'application/vnd.openxmlformats-officedocument.presentationml.template',

      // # Audio

      'audio/*',

      // # Video

      'video/*',

      // # 3D models
      'model/*',
      'application/*',
      // # Code snippets
      'text/javascript',
      'application/x-php',
      'text/html',
      'text/css',
      'application/python-bytecode',

      // # Design templates
      'application/vnd.adobe.photoshop',
      'application/vnd.adobe.illustrator',
      'application/vnd.adobe.indesign',

      // # Ebooks
      'application/epub+zip',
      'application/x-mobipocket-ebook',
      'application/pdf',

      // # Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',

      // # Spreadsheets
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      'application/vnd.oasis.opendocument.spreadsheet',

      // # Drawings

      'image/svg+xml',
      'application/vnd.adobe.illustrator',

      // # Other formats
      'application/x-shockwave-flash',
      'application/x-director',
      'application/x-java-applet',
      'application/x-ms-wmv',

      'application/wasm',
      'model/gltf+json',
      'image/webp',
      'image/avif',
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: () => false,
      },
      hasMany: false,
      required: true,
    },
  ],
};
