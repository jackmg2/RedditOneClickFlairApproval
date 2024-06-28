import { Devvit, SettingScope } from '@devvit/public-api';

Devvit.configure({ redditAPI: true, http: false });

export enum Setting {
  Flair = 'flair-settings'
}

Devvit.addSettings([
  {
    type: 'string',
    name: Setting.Flair,
    label: 'Flair to automatically apply',
    scope: SettingScope.Installation
  },
]);

Devvit.addMenuItem({
  location: 'post',
  forUserType: 'moderator',
  label: 'Verify and Approve',
  onPress: async (event, context) => {
    const post = await context.reddit.getPostById(context.postId as string);
    const author = await context.reddit.getUserById(post.authorId as string);
    const subRedditName = (await context.reddit.getSubredditById(context.subredditId)).name;

    try {
      // Approve the author
      const approveUserPromise = context.reddit.approveUser(author.username, subRedditName);
      const flairTemplates = await context.reddit.getUserFlairTemplates(subRedditName);
      const expectedFlairName = await context.settings.get(Setting.Flair);
      const expectedFlairTemplate = flairTemplates.find(f=>f.text==expectedFlairName);
      // Apply "Verified" flair to the author
      const setUserFlairPromise = context.reddit.setUserFlair({
        subredditName: subRedditName,
        username: author.username,
        flairTemplateId: expectedFlairTemplate?.id
      });

      // Approve the post
      const approvePostPromise = await context.reddit.approve(post.id);
      await Promise.all([approveUserPromise, setUserFlairPromise, setUserFlairPromise]);
      context.ui.showToast('User verified and post approved successfully!');
    } catch (error) {
      console.error('Error in verify and approve process:', error);
      context.ui.showToast('An error occurred. Please try again.');
    }
  }
});

export default Devvit;
