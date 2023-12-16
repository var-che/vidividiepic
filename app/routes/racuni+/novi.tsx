import { DataFunctionArgs, json } from '@remix-run/node'
import {
	conform,
	list,
	useFieldList,
	useFieldset,
	useForm,
	type FieldConfig,
} from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { z } from 'zod'

import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { Form, useActionData } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'

const RecieptSenderSchema = z.object({
	url: z
		.string()
		.refine(url => url.startsWith('https://www.purs.gov.rs/'), {
			message: 'URL must start with "https://www.purs.gov.rs/"',
		})
		.refine(
			url => {
				try {
					new URL(url) // Check if the URL is valid
					return true
				} catch (error) {
					return false
				}
			},
			{
				message: 'Invalid URL format',
			},
		),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	await validateCSRF(formData, request.headers)
	const submission = await parse(formData, { schema: RecieptSenderSchema })

	if (submission.intent !== 'submit') {
		return json({ submission } as const)
	}

	if (!submission.value) {
		return json({ submission } as const, { status: 400 })
	}
    console.log({submission})
	return json({ sub: true, userId })
}

export default function NoviRacun({ racun }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	// console.log({ racun, actionData, isPending })
	const [form, fields] = useForm({
		id: 'racun-submitter',
		constraint: getFieldsetConstraint(RecieptSenderSchema),
		// lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: RecieptSenderSchema })
		},
		defaultValue: {
			url: racun?.url ?? '',
		},
	})

	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div className="w-full bg-muted pl-2 md:container md:mx-2  md:pr-0">
				<p>Ovde je mesto da se šalje link računa </p>
				<Form
					method="POST"
					className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
					{...form.props}
					encType="multipart/form-data"
				>
					<AuthenticityTokenInput />
					{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
					<button type="submit" className="hidden" />
					<Field
						labelProps={{ children: 'Url' }}
						inputProps={{
							autoFocus: true,
							...conform.input(fields.url, { ariaAttributes: true }),
						}}
						errors={fields.url.errors}
					/>
					<StatusButton
						form={form.id}
						type="submit"
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						posalji
					</StatusButton>
				</Form>
			</div>
		</main>
	)
}
