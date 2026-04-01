import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");
  return { title: t("title") };
}

async function PrivacyPolicy(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert">
      <h1 data-testid="privacy-policy-title">{t("title")}</h1>
      <p>{t("lastUpdated")}</p>
      <p data-testid="privacy-policy-description">{t("description1")}</p>
      <p>{t("description2")}</p>
      <h2>{t("interpretation_and_definitions")}</h2>
      <h3>{t("interpretation")}</h3>
      <p>{t("interpretation_description")}</p>
      <h3>{t("definitions")}</h3>
      <p>{t("definitions_description")}</p>
      <ul>
        <li>
          <strong>{t("account_title")}</strong>
          {t("account_description")}
        </li>
        <li>
          <strong>{t("affiliate_title")}</strong>
          {t("affiliate_description")}
        </li>
        <li>
          <strong>{t("company_title")}</strong>
          {t("company_description")}
        </li>
        <li>
          <strong>{t("cookies_title")}</strong>
          {t("cookies_definition")}
        </li>
        <li>
          <strong>{t("device_title")}</strong>
          {t("device_description")}
        </li>
        <li>
          <strong>{t("personal_data_title")}</strong>
          {t("personal_data_definition")}
        </li>
        <li>
          <strong>{t("service_title")}</strong>
          {t("service_description")}
        </li>
        <li>
          <strong>{t("service_provider_title")}</strong>
          {t("service_provider_description")}
        </li>
        <li>
          <strong>{t("usage_data_title")}</strong>
          {t("usage_data_description")}
        </li>
        <li>
          <strong>{t("website_title")}</strong>
          {t("website_description")}
          <a
            href="https://react-boilerplate-coral.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://react-boilerplate-coral.vercel.app
          </a>
        </li>
        <li>
          <strong>{t("you_title")}</strong>
          {t("you_description")}
        </li>
      </ul>
      <h2>{t("collecting_and_using_personal_data")}</h2>
      <h3>{t("types_of_data_collected")}</h3>
      <h4>{t("personal_data")}</h4>
      <p>{t("personal_data_description")}</p>
      <ul>
        <li>{t("usage_data")}</li>
      </ul>
      <h4>{t("usage_data")}</h4>
      <p>{t("usage_data_auto_collected")}</p>
      <p>{t("mobile_device_info_collection")}</p>
      <p>{t("browser_info_collection")}</p>
      <h4>{t("tracking_technologies_and_cookies")}</h4>
      <p>{t("tracking_technologies_and_cookies_description")}</p>
      <ul>
        <li>
          <strong>{t("cookies_or_browser_cookies")}</strong>{" "}
          {t("cookies_description")}
        </li>
        <li>
          <strong>{t("web_beacons")}</strong> {t("web_beacons_description")}
        </li>
      </ul>
      <p>{t("cookies_paragraph")}</p>
      <p>{t("purpose_of_cookies")}</p>
      <ul>
        <li>
          <strong>{t("necessary_cookies_title")}</strong>
          <p>{t("session_cookies")}</p>
          <p>{t("administered_by")}</p>
          <p>{t("necessary_cookies_purpose")}</p>
        </li>
        <li>
          <strong>{t("cookies_policy_title")}</strong>
          <p>{t("persistent_cookies")}</p>
          <p>{t("administered_by")}</p>
          <p>{t("cookies_policy_purpose")}</p>
        </li>
        <li>
          <strong>{t("functionality_cookies_title")}</strong>
          <p>{t("persistent_cookies")}</p>
          <p>{t("administered_by")}</p>
          <p>{t("functionality_cookies_purpose")}</p>
        </li>
      </ul>
      <p>{t("cookies_policy_info")}</p>
      <h3>{t("use_of_personal_data")}</h3>
      <p>{t("personal_data_purposes")}</p>
      <ul>
        <li>
          <strong>{t("provide_and_maintain_service")}</strong>{" "}
          {t("provide_and_maintain_service_desc")}
        </li>
        <li>
          <strong>{t("manage_account")}</strong> {t("manage_account_desc")}
        </li>
        <li>
          <strong>{t("performance_of_contract")}</strong>{" "}
          {t("performance_of_contract_desc")}
        </li>
        <li>
          <strong>{t("contact_you")}</strong> {t("contact_you_desc")}
        </li>
        <li>
          <strong>{t("provide_news_and_offers")}</strong>{" "}
          {t("provide_news_and_offers_desc")}
        </li>
        <li>
          <strong>{t("manage_requests")}</strong> {t("manage_requests_desc")}
        </li>
        <li>
          <strong>{t("business_transfers")}</strong>{" "}
          {t("business_transfers_desc")}
        </li>
        <li>
          <strong>{t("other_purposes")}</strong> {t("other_purposes_desc")}
        </li>
      </ul>
      <p>{t("personal_data_sharing")}</p>
      <ul>
        <li>
          <strong>{t("with_service_providers")}</strong>{" "}
          {t("with_service_providers_desc")}
        </li>
        <li>
          <strong>{t("for_business_transfers")}</strong>{" "}
          {t("for_business_transfers_desc")}
        </li>
        <li>
          <strong>{t("with_affiliates")}</strong> {t("with_affiliates_desc")}
        </li>
        <li>
          <strong>{t("with_business_partners")}</strong>{" "}
          {t("with_business_partners_desc")}
        </li>
        <li>
          <strong>{t("with_other_users")}</strong> {t("with_other_users_desc")}
        </li>
        <li>
          <strong>{t("with_consent")}</strong> {t("with_consent_desc")}
        </li>
      </ul>
      <h3>{t("retention_of_personal_data")}</h3>
      <p>{t("retention_policy_paragraph1")}</p>
      <p>{t("retention_policy_paragraph2")}</p>
      <h3>{t("transfer_of_personal_data")}</h3>
      <p>{t("transfer_info_paragraph1")}</p>
      <p>{t("transfer_info_paragraph2")}</p>
      <p>{t("transfer_info_paragraph3")}</p>
      <h3>{t("delete_personal_data")}</h3>
      <p>{t("delete_info_paragraph1")}</p>
      <p>{t("delete_info_paragraph2")}</p>
      <p>{t("delete_info_paragraph3")}</p>
      <p>{t("delete_info_paragraph4")}</p>
      <h3>{t("disclosure_of_personal_data")}</h3>
      <h4>{t("business_transactions")}</h4>
      <p>{t("business_transactions_paragraph")}</p>
      <h4>{t("law_enforcement")}</h4>
      <p>{t("law_enforcement_paragraph")}</p>
      <h4>{t("other_legal_requirements")}</h4>
      <p>{t("other_legal_requirements_paragraph")}</p>
      <ul>
        <li>{t("legal_requirement_item1")}</li>
        <li>{t("legal_requirement_item2")}</li>
        <li>{t("legal_requirement_item3")}</li>
        <li>{t("legal_requirement_item4")}</li>
        <li>{t("legal_requirement_item5")}</li>
      </ul>
      <h3>{t("security_of_personal_data")}</h3>
      <p>{t("security_paragraph")}</p>
      <h2>{t("childrens_privacy")}</h2>
      <p>{t("childrens_privacy_paragraph1")}</p>
      <p>{t("childrens_privacy_paragraph2")}</p>
      <h2>{t("links_to_other_websites")}</h2>
      <p>{t("links_to_other_websites_paragraph1")}</p>
      <p>{t("links_to_other_websites_paragraph2")}</p>
      <h2>{t("changes_to_privacy_policy")}</h2>
      <p>{t("changes_to_privacy_policy_paragraph1")}</p>
      <p>{t("changes_to_privacy_policy_paragraph2")}</p>
      <p>{t("changes_to_privacy_policy_paragraph3")}</p>
      <h2>{t("contact_us")}</h2>
      <p>{t("contact_us_paragraph")}</p>
      <ul>
        <li>
          {t("contact_us_by_email")}{" "}
          <a
            href="mailto:boilerplates@brocoders.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            boilerplates@brocoders.com
          </a>
        </li>
        <li>
          {t("contact_us_on_website")}{" "}
          <a
            href="https://bcboilerplates.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            bc boilerplates
          </a>
        </li>
        <li>
          {t("contact_us_on_github_discussions")}{" "}
          <a
            href="https://github.com/brocoders/nestjs-boilerplate/discussions"
            target="_blank"
            rel="noopener noreferrer"
          >
            nestjs-boilerplate
          </a>{" "}
          {t("contact_us_on_github_discussions_or")}{" "}
          <a
            href="https://github.com/brocoders/extensive-react-boilerplate/discussions"
            target="_blank"
            rel="noopener noreferrer"
          >
            extensive-react-boilerplate
          </a>
        </li>
        <li>
          {t("contact_us_on_discord")}{" "}
          <a
            href="https://discord.com/channels/520622812742811698/1197293125434093701"
            target="_blank"
            rel="noopener noreferrer"
          >
            channel
          </a>
        </li>
      </ul>
    </div>
  );
}

export default PrivacyPolicy;
