import Route from '@ember/routing/route';

export default class MainRoute extends Route {
  async model() {
    const resp = await (await fetch(`/api/mascots`)).json();
    const processedData = resp.data.map((item) => {
      const title = item.attributes.title;
      const imageUrl = item.attributes['image-url'].replace(
        /https:\/\/emberjs.com\/images\/tomsters(:?\/corp)?/,
        `/images/mascots`
      );
      return { title, imageUrl };
    });
    return processedData;
  }
}
