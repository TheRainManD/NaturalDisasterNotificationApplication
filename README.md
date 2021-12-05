## Natural Disaster Notification Application  
Note: All API keys and secrets in the application were removed for security and privacy concerns.  
<br>  

### Motivation  
Receiving information in time is crucial in the event of natural disasters. Platform like Twitter has large potential to be used in this area. Verified accounts like "USGS" is controlled by offcial government agencies which ensures the validity of information. However, it's common for these accounts to post non-emergency information like preventive posts and replying to other Tweets. Receiving all these information in notification could be overwhelming to users and decrease the feeling of urgentcy for such notification. We wanted to build an application which could filter out all non-emergency posts and deliver only emergency Tweets to users as notification while preserving the ability for users  to choose the type of natural disasters and matching locations to receive notification on just like the flexibility to follow different accounts on Twitter.  
<br>  

### Application Architecture  
<p align="center">
  <img src="/img/architecture.png" alt="Application Architecture" width="600" > 
</p>
 
Our application contains four main components 

 * Pull Server
   * Intergrated with Twitter API to maintain a live stream and listen for new Tweets from our list of verified accounts
   * Sends new Tweets to Analysis Server via HTTP request
 * Analysis Server  
   * Use a self-trained Bert-based multitask model to
     * Classify whether a Tweet is emergency related
     * Classify an emergency related Tweet to be one of the disaster types
   * Use a self-trained Bert-based Named Entity Recognition model to extract location strings from text
   * Sends emergency Tweet along with classification result and location strings to Notification Server via HTTP request
 * Notification Server  
   * Sends push notification to users with matching disaster type and location subscriptions
   * Creates/updates geofence object with incident information for geofence feature
   * Saves disaster incident as a new incident or update to a previous incident (The same type of disaster happening at the same location within 24 hours would be considered the same incident)
 * Frontend Mobile Application  
   * Receive and display push notification
   * Creates local push notification upon entering a geofence object (if geofence feature is enabled in setting)
   * Displays neayby disasters in both list view and map view  
 <br>  
 
 ### UI Functionalities  
 
 - Receiving and displaying notification  
   ##### Test account posting emergency Tweet:  
   <img src="/img/tweetPosting.png" alt="Posting Test Tweet" width="500" >  

   ##### Received notification:
   <img src="/img/uiDemo.jpg" alt="Receiving Notification" width="300" >  
 
 - Showing nearby disasters  
   ##### List view:  
   <img src="/img/uiListView.png" alt="Receiving Notification" width="300" >  

   ##### Map view:  
   <img src="/img/uiMapView.png" alt="Receiving Notification" width="300" >  
 
 - There are two main ways to receive disaster notification:
   - Subscription based (Disaster type & location)
     ##### Disaster type subscription:  
     <img src="/img/uiTopicSelection.png" alt="Receiving Notification" width="300" >  
     
     ##### Location subscription:  
     <img src="/img/uiLocationSelection.png" alt="Receiving Notification" width="300" >  
     
   - Geofence based (Notified when entering the impacted area of a disaster)  
     ##### Geofence feature under "Settings":  
     <img src="/img/uiSetting.png" alt="Receiving Notification" width="300" >
     
