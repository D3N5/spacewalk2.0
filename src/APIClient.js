import config from './config';

const toQueryString = object =>
  Object.keys(object)
    .map(key => `${key}=${object[key]}`)
    .join("&");

const transformItem = item => {
  const data = item.data[0];
  const links = item.links[0];
  const newItem = {
    id: data.nasa_id,
    description: data.description,
    title: data.title,
    type: data.media_type,
    imgVideo: links.href,
    keywords: [data.keywords],
    date: data.date_created
  };

  if (newItem.type === 'image') {
    newItem.thumb = item.links[0].href;
  }
  return newItem;
};

function search({
  audio, video, id, image, query
}) {
  const queryObject = {};

  if (query) {
    queryObject.q = query;
  }

  if (audio) {
    queryObject.media_type = 'audio';
  }
  if (video) {
    queryObject.media_type = 'video';
  }

  if (image) {
    queryObject.media_type = 'image';
  }

  if (id) {
    queryObject.nasa_id = id;
  }

  const uri = `${config.BASE_URL}/search?${toQueryString(queryObject)}`;

  const encodedURI = encodeURI(uri);

  return fetch(encodedURI)
    .then(result => result.json())
    .then(({ collection: { items } }) => items)
    .then(items => items.map(transformItem));
}

function getAssetImageById(id) {
  const uri = `${config.BASE_URL}/asset/${id}`;

  const encodedURI = encodeURI(uri);

  return fetch(encodedURI)
    .then(result => result.json())
    .then(({ collection: { items } }) => items[1].href);
}

function getAssetById(id) {
  return Promise.all([getAssetImageById(id), search({ id })]).then(
    ([href, items]) => ({
      ...items[0],
      href
    })
  );
}

export default {
  getAssetById,
  search
};
