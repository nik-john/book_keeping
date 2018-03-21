### Bokio frontend test: Bank import UI

At Bokio we have a feature where you can go into your internet bank, copy your transaction history (ctrl + a, ctrl + c) and paste this into a text area which will then be parsed as bank transactions into our bookkeeping application.

See example: https://app.bokio.se/demo/bank 

#### The Assignment

Design and build the HTML, Javascript and CSS for this feature’s functionality.

#### The use case
This feature is used in Bokio in order to allow users to do their accounting faster and more accurately by reading all the dates and sums from the bank. The only task for the user is then to categorise the transaction (defining whether it was a computer purchase or rent for example).

Basically this is a work around as the banks don’t have open API's at the moment. So instead of reading directly from a users bank account, the user logs into their bank and then copies the whole page and pastes it in Bokio. Our api reads through the pasted content and analyses which data is a bank transaction row and which items represent description, transaction amount and payment date etc.
After the data is analysed, the user will bookkeep one bank row at the time. The purpose of this feature is to save the user a lot of time by having the transaction dates and sums prefilled and ready for bookkeeping.

 - The user wants to see what they have saved before
 - The user wants to be able to save a new bank data paste
 - If Bokio doesn’t understand the paste perfectly the user might need to change the columns
 - If there are duplicates in the paste then the user might want to choose not to ignore the rows
Bokio thinks should be ignored.

### Notes
    
#### Features:

    • The user wants to see what they have saved before
    • The user wants to be able to save a new bank data paste
    • If Bokio doesn’t understand the paste perfectly the user might need to change the columns
    • If there are duplicates in the paste then the user might want to choose not to ignore the rows
        Bokio thinks should be ignored.

 #### Highlights/Enhancements:

    • Application is completely Responsive and uses the lates and greatest CSS, including FlexBox & KeyFrames
    • Introduced SCSS
    • Introduced ES6, ES7 using Babel
    • Used async/await functions and native Promises
    • Maximum functional programming (map, filter etc.)
    • Reset CSS for cross browser consistency
    • Instant feedback through Flash Messages
    • No libraries used. Everything has been coded from scratch
    • Tested for multiple data sets
    • CSS animations on Buttons and Flash messages for Rich UX
    • Error handling has been implemente for all major use cases
    • Made the Angular App long poll for data, so that page reload can be avoided


####  TODOs/Nice-to-haves:

    • Commit column change to API
    • Implement the Book Keeping on a Modal instead of block tables
    • Use more Icons and lesser Text
