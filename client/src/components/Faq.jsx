import '../styles/Faq.css'

function Faq() {
    return (
        <>
            <div className='faqContainer'>
                <h1 className='faqTitle'>FAQ</h1>
                <h2 className='faqSubtitles'>What payment methods are available?</h2>
                <p className='faqTexts'>We accept payments through Mercado Pago, allowing you to use credit cards, debit cards, bank transfers, and cash at authorized locations. Mercado Pago ensures fast and secure transactions.</p>
                <ul>
                    <li>Mercadopago</li>
                    <li>Credit card, MasterCard, Maestro & Visa(MP)</li>
                </ul>

                <h2 className='faqSubtitles'>How does shipping work?</h2>
                <p className='faqTexts'>We ship nationwide using Mercado Envíos. You can select your preferred shipping method at checkout and will receive a tracking number to monitor your order.</p>

                <h2 className='faqSubtitles'>How long does delivery take?</h2>
                <p className='faqTexts'>Delivery times depend on your location and the selected shipping method. Generally, orders take 3 to 7 business days to arrive. During promotions or special events, delivery times may be longer.</p>

                <h2 className='faqSubtitles'>Can I pick up my order in person?</h2>
                <p className='faqTexts'>At the moment, we do not offer in-person pickup. All orders are shipped exclusively through Mercado Envíos.</p>

                <h2 className='faqSubtitles'>What should I do if my product arrives damaged or defective?</h2>
                <p className='faqTexts'>If your product arrives damaged or defective, you can file a claim directly through Mercado Pago. We are committed to resolving any issues, whether through a replacement or a refund, as needed.</p>

                <h2 className='faqSubtitles'>Can I return or exchange a product?</h2>
                <p className='faqTexts'>We accept returns and exchanges within 7 business days of receiving your order. The product must be unused and in its original packaging. To start the process, contact us via email or social media.</p>

                <h2 className='faqSubtitles'> Is my purchase protected?</h2>
                <p className='faqTexts'>Your purchase is covered by Mercado Pago's protections, ensuring secure payment and delivery. If there’s an issue with your order, you can request assistance directly through your Mercado Libre or Mercado Pago account.</p>

                <h2 className='faqSubtitles'>How can I contact you if I have a question or issue?</h2>
                <p className='faqTexts'>You can reach us via our social media platforms or by sending us an email. We’ll respond as quickly as possible to assist you.</p>

                <h2 className='faqSubtitles'>If you have further questions, don’t hesitate to contact us. We’re here to help!</h2>


            </div>
        </>
    )
}

export default Faq;
